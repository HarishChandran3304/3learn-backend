'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useParams } from 'next/navigation';

interface Question {
  Question: string;
  Options: string[];
  Answer: string;
}

interface Quiz {
  Questions: Question[];
}

export default function QuizPage() {
  const params = useParams();
  const classId = params.classId as string;
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const response = await fetch(`http://localhost:8000/class/${classId}/quiz`);
        if (!response.ok) {
          throw new Error(`Failed to load quiz: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        setQuiz(data.quiz);
      } catch (error) {
        console.error('Error loading quiz:', error);
        setError('Failed to load quiz. Please try again later.');
      }
    };
    loadQuiz();
  }, [classId]);

  if (!quiz) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Loading quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6">
          <CardContent>
            <p className="text-lg text-red-600 text-center">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4 w-full">Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAnswerSelect = (value: string) => {
    setSelectedAnswer(value);
  };

  const handleNext = () => {
    if (selectedAnswer === quiz.Questions[currentQuestion].Answer) {
      setScore(score + 1);
    }

    if (currentQuestion < quiz.Questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer('');
    } else {
      setShowResults(true);
    }
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setSelectedAnswer('');
    setScore(0);
    setShowResults(false);
  };

  if (showResults) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Quiz Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-lg mb-2">Your score:</p>
              <p className="text-3xl font-bold">{score} / {quiz.Questions.length}</p>
              <p className="text-lg mt-2">
                ({Math.round((score / quiz.Questions.length) * 100)}%)
              </p>
            </div>
            <Button onClick={handleRetry} className="w-full mt-4">Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Question {currentQuestion + 1}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg">{quiz.Questions[currentQuestion].Question}</p>
          <Separator className="my-4" />
          <RadioGroup
            value={selectedAnswer}
            onValueChange={handleAnswerSelect}
            className="space-y-3"
          >
            {quiz.Questions[currentQuestion].Options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
          <Button
            onClick={handleNext}
            className="w-full mt-4"
            disabled={!selectedAnswer}
          >
            {currentQuestion < quiz.Questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}