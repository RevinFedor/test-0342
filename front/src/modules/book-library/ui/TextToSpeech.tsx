// TextToSpeech.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/shared/ui/components/ui/button';
import { Slider } from '@/shared/ui/components/ui/slider';

interface TextToSpeechProps {
    text: string;
    onEnd?: () => void;
    onPause?: () => void;
    onResume?: () => void;
}

const TextToSpeech: React.FC<TextToSpeechProps> = ({ text, onEnd, onPause, onResume }) => {
    const [rate, setRate] = useState(1);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    console.log(text);

    useEffect(() => {
        return () => {
            synthRef.current.cancel();
        };
    }, []);

    const handleSpeak = () => {
        if (synthRef.current.speaking) {
            synthRef.current.cancel();
        }
        if (text !== '') {
            utteranceRef.current = new SpeechSynthesisUtterance(text);
            utteranceRef.current.rate = rate;
            utteranceRef.current.onstart = () => setIsSpeaking(true);
            utteranceRef.current.onend = () => {
                setIsSpeaking(false);
                if (onEnd) onEnd();
            };
            utteranceRef.current.onpause = () => {
                setIsPaused(true);
                if (onPause) onPause();
            };
            utteranceRef.current.onresume = () => {
                setIsPaused(false);
                if (onResume) onResume();
            };
            synthRef.current.speak(utteranceRef.current);
        }
    };

    const handlePauseResume = () => {
        if (isPaused) {
            synthRef.current.resume();
        } else {
            synthRef.current.pause();
        }
        setIsPaused(!isPaused);
    };

    const handleStop = () => {
        synthRef.current.cancel();
        setIsSpeaking(false);
        setIsPaused(false);
    };

    return (
        <div className="text-to-speech-controls">
            <div className="mb-4">
                <label className="block mb-2">Скорость речи: {rate.toFixed(1)}x</label>
                <Slider min={0.5} max={8} step={0.1} value={[rate]} onValueChange={(values) => setRate(values[0])} className="w-full" />
            </div>
            <div className="flex space-x-2">
                <Button onClick={handleSpeak} disabled={isSpeaking && !isPaused}>
                    {isSpeaking ? 'Перезапустить' : 'Озвучить'}
                </Button>
                <Button variant="secondary" onClick={handlePauseResume} disabled={!isSpeaking}>
                    {isPaused ? 'Возобновить' : 'Пауза'}
                </Button>
                <Button variant="destructive" onClick={handleStop} disabled={!isSpeaking && !isPaused}>
                    Стоп
                </Button>
            </div>
        </div>
    );
};

export default TextToSpeech;
