import { useNavigate, useParams } from "react-router-dom";

import { Dispatch, FC, SetStateAction, useContext, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "react-query";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@shared/components/ui/button";
import { ScrollArea } from "@shared/components/ui/scroll-area";
import { getQuiz } from "@entity/Quiz";
import { OrganizationContext } from "@app/providers/AppRouter/AppRouter.config";
import { createSession, SessionStatus } from "@entity/Session";
import { createParticipant, ParticipantRole } from "@entity/Participant";
import { Avatar, AvatarFallback, AvatarImage } from "@shared/components/ui/avatar";
import { Question } from "@entity/Question";
import { Card, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";

const WebSocketUrl = import.meta.env.VITE_API;

type MessageType = "join" | "start" | "next" | "leave" | "finish" | "cancel" | "error"
const messageTypes: MessageType[] = ["join", "start", "next", "leave", "finish", "cancel", "error"];

type MessageHandlers = Record<MessageType, (data: object) => void>

export const useWebSocket = (url: string | null, sessionId?: string) => {
  const [data, setData] = useState();
  const socketRef = useRef<WebSocket | null>(null);
  const [messageHandlers, setMessageHandlers] = useState<MessageHandlers | null>(null);

  useEffect(() => {
    if (!url || !sessionId) return;

    socketRef.current = new WebSocket(url + "/api/v1/sessions/handle/id/" + sessionId);
    const socket = socketRef.current;

    socket.onmessage = (event) => {
      if (!messageHandlers) return;
      try {
        const message = JSON.parse(event.data);
        if (typeof message.type !== "string" || !messageTypes.includes(message.type)) return;

        const handler = messageHandlers[message.type as MessageType];
        handler(message);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    socket.onopen = (e => {
      socket.send(JSON.stringify({ type: "join", username: "host" }));
    });
  }, [url, sessionId, messageHandlers]);

  return { data, setMessageHandlers, send: (data: string) => socketRef.current?.send(data) };
};

export const useQuizSession = () => {
  const { id: quizId } = useParams();
  const organizationContext = useContext(OrganizationContext);
  const currentOrganizationId = organizationContext?.activeOrganization.id;

  const { data: quizData, isLoading, error } = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: async () => {
      return await getQuiz({
        organizationId: currentOrganizationId,
        quizId: quizId,
      });
    },
  });

  const { mutate: createSessionMutate, data: sessionData } = useMutation(createSession);
  const { mutate: createHost, data: hostData } = useMutation(createParticipant);

  const { data, setMessageHandlers, send } = useWebSocket(WebSocketUrl, sessionData?.data?.id);

  useEffect(() => {
    setMessageHandlers(prev => ({
      ...prev as MessageHandlers,
      "start": (data) => console.log(data),
    }));
  }, [setMessageHandlers]);

  const startQuiz = () => {
    send(JSON.stringify({ type: "start" }));
  };

  const nextQuestion = () => {
    send(JSON.stringify({ type: "next" }));
  };

  const finishQuiz = () => {
    send(JSON.stringify({ type: "finish" }));
  };

  const endQuiz = () => {
    send(JSON.stringify({ type: "cancel" }));
  };

  return {
    setMessageHandlers,
    quiz: quizData?.data,
    isLoading,
    endQuiz,
    finishQuiz,
    startQuiz,
    nextQuestion,
    error,
    session: sessionData?.data,
    createSessionMutate,
    createHost,
    hostData,
  };
};

interface QuizSessionViewProps {
  sessionCode?: string;
  participants: Array<{
    id: string
    name: string
    score: number
  }>;
}

export function QuizSessionView({ sessionCode, participants }: QuizSessionViewProps) {
  const joinUrl = `${window.location.origin}/join/${sessionCode}`;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Подключение участников</h2>

      <div className="flex items-center gap-6">
        <div className="border rounded p-4">
          <QRCodeSVG
            value={joinUrl}
            size={180}
            level="H"
          />
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-2">Код сессии:</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold">{sessionCode}</span>
            <Button>{joinUrl}</Button>
          </div>

          <p className="text-sm text-gray-600 mt-4 mb-2">Ссылка для подключения:</p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded truncate max-w-xs">
              {joinUrl}
            </span>
            <Button>{joinUrl}</Button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-medium mb-2">Статус подключения</h3>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500"></span>
          <span>Ожидание участников ({participants.length} подключено)</span>
        </div>
      </div>
    </div>
  );
}

type participantsForView = {
  user_id: string;
  participant_id: string
  username: string
  photo_url: string
  role: ParticipantRole
}

interface QuizParticipantsListProps {
  participants: participantsForView[];
}

export function QuizParticipantsList({ participants }: QuizParticipantsListProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 h-full">
      <h2 className="text-xl font-semibold mb-4">Участники</h2>

      <ScrollArea className="h-[calc(100%-2rem)]">
        <div className="space-y-2">
          {participants.map(participant => (
            <div key={participant?.user_id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={participant?.photo_url}
                  alt={participant?.username}
                />
                <AvatarFallback className="text-4xl w-full h-full flex items-center justify-center">
                  {participant?.username}
                </AvatarFallback>
              </Avatar>
              <span>{participant?.username}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

interface QuizSessionControlsProps {
  onStart: () => void;
  onEnd: () => void;
  sessionStatus: SessionStatus;
}

export function QuizSessionControls({ onStart, onEnd, sessionStatus }: QuizSessionControlsProps) {
  return (
    <div className="flex justify-between mt-6">
      <Button variant="outline" onClick={onEnd}>
        Завершить сессию
      </Button>

      <Button
        onClick={onStart}
        disabled={sessionStatus !== "waiting"}
      >
        Начать квиз
      </Button>
    </div>
  );
}

interface QuizSessionHeaderProps {
  title?: string;
}

export function QuizSessionHeader({ title }: QuizSessionHeaderProps) {
  return (
    <header className="text-center">
      <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
    </header>
  );
}

const Counter: FC<{ next: Dispatch<SetStateAction<Stages>> }> = props => {
  const { next } = props;
  const [count, setCount] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [next]);

  useEffect(() => {
    if (count === 0) {
      next("questions");
    }
  }, [count]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="text-9xl font-bold text-foreground">{count}</div>
    </div>
  );
};

interface QuizPageProps {
  question?: Question & { isLast: boolean };
  onNext: () => void;
  onFinish: () => void;
}

export function QuizPage({ question, onNext, onFinish }: QuizPageProps) {
  const [showAnswers, setShowAnswers] = useState(false);

  console.log(question);

  const handleShowAnswers = () => {
    setShowAnswers(true);
  };

  const handleNext = () => {
    setShowAnswers(false);
    onNext();
  };

  if (!question) return <></>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center mb-4">
            {question.title}
          </CardTitle>
          {question.description && (
            <CardDescription className="text-lg text-center">
              {question.description}
            </CardDescription>
          )}
        </CardHeader>
      </Card>

      {question.media_path && (
        <div className="mb-8 flex justify-center">
          <Avatar>
            <AvatarImage
              src={question.media_path}
              alt="Question media"
              className="max-h-96 rounded-lg object-contain"
            />
          </Avatar>
        </div>
      )}

      <div className="grid gap-4 mb-8">
        {question.answers
          .sort((a, b) => a.order - b.order)
          .map(answer => (
            <div
              key={answer.text}
              className={`p-4 border rounded-lg text-lg ${
                showAnswers && answer.is_correct
                  ? "bg-green-100 border-green-500"
                  : "bg-background"
              }`}
            >
              {answer.text}
            </div>
          ))}
      </div>

      <div className="flex justify-center gap-4">
        <Button
          size="lg"
          className="px-8 py-4 text-lg"
          onClick={handleShowAnswers}
          disabled={showAnswers}
        >
          Показать ответ
        </Button>

        <Button
          size="lg"
          className="px-8 py-4 text-lg"
          onClick={question.isLast ? onFinish : onNext}
          variant="outline"
        >
          {question.isLast ? "Завершить квиз" : "Далее"}
        </Button>
      </div>
    </div>
  );
}

type Stages = "start" | "counter" | "questions" | "results";

function StartQuiz() {
  const {
    quiz,
    isLoading,
    error,
    session,
    createHost,
    createSessionMutate,
    setMessageHandlers,
    startQuiz,
    nextQuestion,
    endQuiz,
    finishQuiz,
  } = useQuizSession();

  const organizationContext = useContext(OrganizationContext);
  const currentOrganizationId = organizationContext?.activeOrganization.id;
  const [participants, setParticipants] = useState<participantsForView[]>([]);
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stages>("start");
  const [currentQuestion, setCurrentQuestion] = useState<Question & { isLast: boolean }>();
  const { id: quizId } = useParams();

  useEffect(() => {
    createSessionMutate({
      organizationId: currentOrganizationId as string,
      quizId: quizId as string,
    });
  }, [createSessionMutate, createSessionMutate]);

  useEffect(() => {
    setMessageHandlers(prev => ({
      ...prev as MessageHandlers,
      "join": (data) => {
        setParticipants(prev => [...prev, data as participantsForView]);
      },
      "leave": (data) => {
        if (!(data as any)?.participant_id) return;

        setParticipants(prev => prev.filter(el => el.participant_id !== (data as any).participant_id));
      },
      "cancel": (data) => {
        navigate("/", { replace: true });
      },
      "start": (data) => {
        setStage("counter");
        if ((data as any)?.question)
          setCurrentQuestion({ ...(data as any)?.question, isLast: (data as any).is_last_question });
      },
      "next": (data) => {
        console.log(data);
        if ((data as any)?.question)
          setCurrentQuestion({ ...(data as any)?.question, isLast: (data as any).is_last_question });
      },
      "finish": (data) => {
        console.log(data);
        setStage("results");
      },
    }));
  }, [setMessageHandlers]);

  useEffect(() => {
    if (!session) return;

    createHost({
      organizationId: currentOrganizationId as string,
      quizId: quizId as string,
      sessionId: session?.id as string,
      session_nickname: "host",
      role: "host",
    });
  }, [createHost, session]);

  const { join_code } = session || {};

  if (stage === "start") return (
    <div className="flex flex-col min-h-screen p-6 max-w-6xl mx-auto">
      <QuizSessionHeader title={quiz?.name} />

      <div className="flex flex-1 gap-6 mt-8">
        <div className="flex-1">
          <QuizSessionView
            sessionCode={join_code}
            participants={[]}
          />
        </div>

        <div className="w-80">
          <QuizParticipantsList participants={participants} />
        </div>
      </div>

      <QuizSessionControls
        onStart={startQuiz}
        onEnd={endQuiz}
        sessionStatus={session?.status || "waiting"}
      />
    </div>
  );

  if (stage === "counter") return (
    <Counter next={setStage} />
  );

  if (stage === "questions") return (
    <QuizPage question={currentQuestion} onNext={nextQuestion} onFinish={finishQuiz} />
  );

  if (stage === "results") return (
    <>
      результаты
    </>
  );
}


export default StartQuiz;
