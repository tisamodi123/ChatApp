import React, { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';

export const CallModal = () => {
  const { isCallModalOpen, setCallModalOpen, selectedConversation } = useChatStore();
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [hasCamera, setHasCamera] = useState(false);
  const localVideoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!isCallModalOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setHasCamera(false);
      return;
    }

    // Attempt real camera stream
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          streamRef.current = stream;
          setHasCamera(true);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch(() => {
          setHasCamera(false);
        });
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isCallModalOpen]);

  if (!isCallModalOpen) return null;

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    } else {
      setIsMicOn((prev) => !prev);
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    } else {
      setIsVideoOn((prev) => !prev);
    }
  };

  const handleEndCall = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCallModalOpen(false);
  };

  const targetName = selectedConversation?.displayName || selectedConversation?.name || 'User';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-base-200 border border-base-300 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-base-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <div>
              <h3 className="font-semibold text-sm text-base-content">
                Calling {targetName}
              </h3>
              <p className="text-xs text-base-content/50">
                Live Video Call Session
              </p>
            </div>
          </div>
          <button onClick={handleEndCall} className="btn btn-sm btn-circle btn-ghost">
            ✕
          </button>
        </div>

        {/* Video Area */}
        <div className="p-4 bg-black/50 min-h-[260px] flex items-center justify-center relative">
          {/* Main Remote Tile */}
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="avatar mb-3">
              <div className="w-20 h-20 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 bg-base-300">
                <img
                  src={
                    selectedConversation?.avatar ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(targetName)}`
                  }
                  alt={targetName}
                />
              </div>
            </div>
            <h4 className="font-semibold text-sm text-white">{targetName}</h4>
            <p className="text-xs text-white/60 mt-1">Ringing...</p>
          </div>

          {/* Local User Camera Preview Tile */}
          <div className="absolute bottom-3 right-3 w-32 h-24 sm:w-40 sm:h-28 bg-neutral-900 rounded-lg overflow-hidden border border-white/20 shadow-lg">
            {hasCamera && isVideoOn ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[11px] text-white/50 bg-neutral-800">
                Camera off
              </div>
            )}
            <div className="absolute bottom-1 left-1 bg-black/70 px-1.5 py-0.5 rounded text-[9px] text-white">
              You
            </div>
          </div>
        </div>

        {/* Call Controls */}
        <div className="p-4 bg-base-300/40 border-t border-base-300 flex items-center justify-center gap-3">
          <button
            onClick={toggleMic}
            className={`btn btn-circle btn-sm ${isMicOn ? 'bg-base-100' : 'btn-error text-white'}`}
            title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleVideo}
            className={`btn btn-circle btn-sm ${isVideoOn ? 'bg-base-100' : 'btn-error text-white'}`}
            title={isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'}
          >
            {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </button>

          <button
            onClick={handleEndCall}
            className="btn btn-error btn-sm px-4 font-semibold text-white gap-1.5"
          >
            <PhoneOff className="w-4 h-4" />
            <span>End Call</span>
          </button>
        </div>
      </div>
    </div>
  );
};
