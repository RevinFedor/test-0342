import { useState, useEffect, useRef } from 'react';
import { Button } from '@/shared/ui/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/components/ui/select';
import { Slider } from '@/shared/ui/components/ui/slider';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@/app/providers/config/store';

const TextToSpeech = () => {
    const dispatch = useDispatch();
    const text = useAppSelector((state) => state.textToSpeech.text);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
    const [rate, setRate] = useState(6);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [currentSentence, setCurrentSentence] = useState(0);
    const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    // set voices by default
    useEffect(() => {
        const updateVoices = () => {
            const availableVoices = synthRef.current.getVoices();
            setVoices(availableVoices);
            const pavelVoice = availableVoices.find((voice) => voice.name === 'Microsoft Pavel - Russian (Russia)');
            if (pavelVoice) {
                setSelectedVoice(pavelVoice);
            }
        };
        updateVoices();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = updateVoices;
        }
    }, []);

    useEffect(() => {
        if (text) {
            handleSpeak();
        }
    }, [text]);

    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

    const handleSpeak = () => {
        if (synthRef.current.speaking) {
            synthRef.current.cancel();
        }
        if (text !== '') {
            utteranceRef.current = new SpeechSynthesisUtterance(text);
            if (selectedVoice) {
                utteranceRef.current.voice = selectedVoice;
            }
            utteranceRef.current.rate = rate;
            utteranceRef.current.onstart = () => setIsSpeaking(true);
            utteranceRef.current.onend = () => {
                setIsSpeaking(false);
                setCurrentSentence(0);
            };
            utteranceRef.current.onboundary = (event: SpeechSynthesisEvent) => {
                const sentenceIndex = sentences.findIndex((sentence, index) => {
                    const start = sentences.slice(0, index).join('').length;
                    const end = start + sentence.length;
                    return event.charIndex >= start && event.charIndex < end;
                });
                if (sentenceIndex !== -1) {
                    setCurrentSentence(sentenceIndex);
                }
            };
            utteranceRef.current.onerror = (event: SpeechSynthesisErrorEvent) => {
                console.error('SpeechSynthesisUtterance error', event);
                setIsSpeaking(false);
                setCurrentSentence(0);
            };
            synthRef.current.speak(utteranceRef.current);
        }
    };

    const handlePauseResume = () => {
        if (isPaused) {
            synthRef.current.resume();
            setIsPaused(false);
        } else {
            synthRef.current.pause();
            setIsPaused(true);
        }
    };

    const handleStop = () => {
        synthRef.current.cancel();
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentSentence(0);
    };

    const highlightText = () => {
        return sentences.map((sentence, index) => (
            <span key={index} className={index === currentSentence ? 'bg-cyan-900' : ''}>
                {sentence}
            </span>
        ));
    };

    return (
        <div className="w-full ">
            <div className="p-6">
                <p className="mb-4 p-2 border rounded">{isSpeaking ? highlightText() : text}</p>
                <Select
                    value={selectedVoice ? selectedVoice.name : ''}
                    onValueChange={(value) => setSelectedVoice(voices.find((voice) => voice.name === value) || null)}
                >
                    <SelectTrigger className="w-full mb-4">
                        <SelectValue placeholder="Выберите голос" />
                    </SelectTrigger>
                    <SelectContent>
                        {voices.map((voice) => (
                            <SelectItem key={voice.name} value={voice.name}>
                                {voice.name} ({voice.lang})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="mb-4">
                    <label className="block mb-2">Скорость речи: {rate.toFixed(1)}x</label>
                    <Slider min={0.1} max={10} step={0.1} value={[rate]} onValueChange={(values) => setRate(values[0])} className="w-full" />
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
        </div>
    );
};

export default TextToSpeech;
