"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { emit, getSocketId, on } from "@/lib/socket";

const ScreenShareContext = createContext(null);
const VIEWING_KEY = "screen-viewing";

function persistViewing(viewing) {
  if (viewing) sessionStorage.setItem(VIEWING_KEY, "1");
  else sessionStorage.removeItem(VIEWING_KEY);
}

function savedViewing() {
  return sessionStorage.getItem(VIEWING_KEY) === "1";
}

export function ScreenShareProvider({ children }) {
  const [socketId, setSocketId] = useState(null);
  const [sharerId, setSharerId] = useState(null);
  const [viewing, setViewing] = useState(false);
  const localStreamRef = useRef(null);
  const previewRef = useRef(null);
  const frameTimerRef = useRef(null);
  const imageRef = useRef(null);
  const frameUrlRef = useRef(null);

  const stopFrames = () => {
    clearInterval(frameTimerRef.current);
    frameTimerRef.current = null;
    previewRef.current?.pause();
    previewRef.current = null;
  };

  const stopLocalStream = () => {
    stopFrames();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
  };

  const stopShare = () => {
    console.log("[screen] share stopped");
    stopLocalStream();
    emit("screen:stop");
  };

  const startFrames = async (stream) => {
    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    await video.play();
    previewRef.current = video;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { alpha: false });
    console.log("[screen] sending frames");

    frameTimerRef.current = setInterval(() => {
      if (!video.videoWidth || !video.videoHeight) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        emit("screen:frame", await blob.arrayBuffer());
      }, "image/jpeg", 0.6);
    }, 100);
  };

  const shareScreen = async () => {
    if (sharerId && sharerId !== socketId) return;
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      stopLocalStream();
      localStreamRef.current = stream;
      stream.getVideoTracks()[0].addEventListener("ended", stopShare);
      console.log("[screen] share started");
      emit("screen:start");
      await startFrames(stream);
    } catch (error) {
      console.error("Screen share was not started:", error);
    }
  };

  const viewScreen = () => {
    if (!sharerId || sharerId === socketId) return;
    console.log("[screen] view requested, waiting for frames…");
    persistViewing(true);
    setViewing(true);
    emit("screen:watch");
  };

  const toggleView = () => {
    if (viewing) {
      persistViewing(false);
      setViewing(false);
      return;
    }
    viewScreen();
  };

  useEffect(() => {
    let received = 0;

    if (savedViewing()) setViewing(true);

    const rejoin = () => {
      if (!savedViewing()) return;
      setViewing(true);
      emit("screen:watch");
    };

    const unsubscribers = [
      on("connect", () => {
        setSocketId(getSocketId());
        rejoin();
      }),
      on("screen:status", ({ sharerId: next }) => {
        const id = getSocketId();
        setSocketId(id);
        setSharerId(next);
        console.log("[screen] sharer:", next || "none");
        if (!next || next === id) {
          persistViewing(false);
          setViewing(false);
        } else {
          rejoin();
        }
        if (next !== id && localStreamRef.current) {
          stopLocalStream();
        }
      }),
      on("screen:frame", (data) => {
        received += 1;
        if (received === 1) console.log("[screen] receiving frames");
        const url = URL.createObjectURL(new Blob([data], { type: "image/jpeg" }));
        if (imageRef.current) imageRef.current.src = url;
        if (frameUrlRef.current) URL.revokeObjectURL(frameUrlRef.current);
        frameUrlRef.current = url;
      }),
    ];

    setSocketId(getSocketId());
    rejoin();

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const isSharer = Boolean(sharerId) && sharerId === socketId;
  const someoneElseSharing = Boolean(sharerId) && sharerId !== socketId;

  return (
    <ScreenShareContext.Provider
      value={{
        isSharer,
        someoneElseSharing,
        shareScreen,
        stopShare,
        viewing,
        toggleView,
      }}
    >
      {children}
      <div
        className={`fixed top-14 right-0 bottom-0 left-0 z-40 bg-black ${viewing ? "" : "hidden"}`}
      >
        <img
          ref={imageRef}
          alt="Shared screen"
          className="h-full w-full object-contain"
        />
      </div>
    </ScreenShareContext.Provider>
  );
}

export function useScreenShare() {
  const context = useContext(ScreenShareContext);
  if (!context) {
    throw new Error("useScreenShare must be used within ScreenShareProvider");
  }
  return context;
}
