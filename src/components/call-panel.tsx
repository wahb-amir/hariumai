
"use client";

import { useState, useEffect } from 'react';
import { PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { cn } from '@/lib/utils';
import { HariumLogo } from './harium-logo';

interface CallPanelProps {
  isMuted: boolean;
  onToggleMute: () => void;
  isSpeakerOn: boolean;
  onToggleSpeaker: (isOn: boolean) => void;
  onEndCall: () => void;
}

export function CallPanel({ isMuted, onToggleMute, isSpeakerOn, onToggleSpeaker, onEndCall }: CallPanelProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prevTime => prevTime + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 rounded-2xl shadow-2xl bg-background/80 backdrop-blur-sm border-2 border-primary/20">
        <div className="p-4 flex flex-col items-center">
          <div className="flex items-center gap-3 w-full mb-4">
            <HariumLogo className="h-10 w-10" />
            <div className='flex-1'>
                <p className="font-bold text-lg">Harium AI Call</p>
                <p className="text-sm text-green-500 font-semibold">{formatTime(elapsedTime)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 w-full">
            <div className='flex flex-col items-center'>
                 <Button
                    variant="outline"
                    size="icon"
                    className={cn("rounded-full w-14 h-14", isMuted && "bg-secondary")}
                    onClick={onToggleMute}
                    >
                    {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </Button>
                <span className='text-xs mt-1'>{isMuted ? 'Unmute' : 'Mute'}</span>
            </div>
            <div className='flex flex-col items-center'>
                 <Button
                    variant="outline"
                    size="icon"
                    className={cn("rounded-full w-14 h-14", !isSpeakerOn && "bg-secondary")}
                    onClick={() => onToggleSpeaker(!isSpeakerOn)}
                    >
                    {isSpeakerOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
                </Button>
                <span className='text-xs mt-1'>{isSpeakerOn ? 'Speaker On' : 'Speaker Off'}</span>
            </div>
             <div className='flex flex-col items-center'>
                 <Button
                    variant="destructive"
                    size="icon"
                    className="rounded-full w-14 h-14"
                    onClick={onEndCall}
                    >
                    <PhoneOff className="h-6 w-6" />
                </Button>
                <span className='text-xs mt-1'>End Call</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
