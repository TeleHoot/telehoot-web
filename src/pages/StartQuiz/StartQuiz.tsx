import { useNavigate, useParams } from "react-router-dom";
import { Dispatch, FC, SetStateAction, useContext, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "react-query";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@shared/components/ui/button";
import { ScrollArea } from "@shared/components/ui/scroll-area";
import { getQuiz } from "@entity/Quiz";
import { OrganizationContext } from "@app/providers/AppRouter/AppRouter.config";
import { createSession, exportResults, SessionStatus } from "@entity/Session";
import { Participant, ParticipantRole } from "@entity/Participant";
import { Avatar, AvatarFallback, AvatarImage } from "@shared/components/ui/avatar";
import { Question } from "@entity/Question";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@shared/components/ui/table";
import dayjs from "dayjs";

const WebSocketUrl = import.meta.env.VITE_API;

type MessageType = "join" | "start" | "next" | "leave" | "finish" | "cancel" | "error" | "answer"
const messageTypes: MessageType[] = ["join", "start", "next", "leave", "finish", "cancel", "error", "answer"];

type MessageHandlers = Record<MessageType, (data: object) => void>

export const useWebSocket = (url: string | null, sessionId?: string) => {
  const [data, setData] = useState();
  const socketRef = useRef<WebSocket | null>(null);
  const [messageHandlers, setMessageHandlers] = useState<MessageHandlers | null>(null);

  useEffect(() => {
    if (!url || !sessionId || !messageHandlers || socketRef.current) return;

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

  const { mutate: createSessionMutate, data: sessionData } = useMutation(['session'],createSession);
  //const { mutate: createHost } = useMutation(createParticipant);

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
  };
};

interface QuizSessionViewProps {
  sessionCode?: string;
}

export function QuizSessionView({ sessionCode }: QuizSessionViewProps) {
  const linkToBot = `https://t.me/${botName}?startapp=${sessionCode}`;

  return (
    <div className="bg-white rounded-2xl p-6 h-[255px]" style={{ boxShadow: "0px -1px 31.5px -7px #1D1D1D40" }}>
      <div className="grid grid-cols-2 h-full">
        <div className="flex flex-col pr-6 items-center justify-center">
          <h2 className="text-xl font-semibold mb-4 font-manrope">Отсканируй QR</h2>
          <div className="flex-1 flex items-center justify-center">
            <div className="p-2 rounded-lg" style={{ border: "2px solid #0D0BCC" }}>
              <QRCodeSVG
                value={linkToBot || ""}
                size={140}
                level="H"
              />
            </div>
          </div>
        </div>

        <div
          className="flex flex-col pl-6 border-l items-center justify-center"
          style={{ borderLeftWidth: "3px", borderColor: "#E3E3E3" }}
        >
          <h2 className="text-xl font-semibold mb-4 font-manrope">Войди по коду</h2>
          <div className="flex-1 flex items-center justify-center">
            <span
              className="text-6xl font-bold font-manrope"
              style={{ color: "#0D0BCC" }}
            >
              {sessionCode}
            </span>
          </div>
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
  const filteredParticipants = participants.filter(p => p.role !== "host");

  return (
    <div className="bg-white rounded-2xl p-6 h-[255px]" style={{ boxShadow: "0px -1px 31.5px -7px #1D1D1D40" }}>
      <h2 className="text-xl font-semibold mb-4 font-manrope text-center">Игроки ({filteredParticipants.length})</h2>

      <ScrollArea className="h-[180px]">
        {filteredParticipants.length === 0 ? (
          <div
            className="flex items-center justify-center h-full font-manrope h-full"
            style={{ color: "#000000" }}
          >
            <span>Ожидаем участников...</span>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {filteredParticipants.map(participant => (
              <div key={participant?.user_id} className="flex flex-col items-center p-2 hover:bg-gray-50 rounded-lg">
                <Avatar className="h-16 w-16 mb-2">
                  <AvatarImage
                    src={participant?.photo_url}
                    alt={participant?.username}
                  />
                  <AvatarFallback className="text-2xl w-full h-full flex items-center justify-center font-inter">
                    {participant?.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-inter text-sm text-center">{participant?.username}</span>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

interface QuizSessionControlsProps {
  onStart: () => void;
  onEnd: () => void;
  sessionStatus: SessionStatus;
  hasParticipants: boolean;
}

// disabled={sessionStatus !== "waiting" || !hasParticipants}
export function QuizSessionControls({ onStart, onEnd, sessionStatus, hasParticipants }: QuizSessionControlsProps) {
  return (
    <div className="flex flex-col justify-center items-center gap-6 mt-6 pt-10">
      <Button
        onClick={onStart}
        className="font-inter hover:bg-blue-300 transition-colors disabled:bg-[#A2ACB0] cursor-pointer"
        style={{
          width: "456px",
          height: "69px",
          borderRadius: "10px",
          padding: "15px 12px",
          backgroundColor: "#0D0BCC",
          fontSize: "32px",
          color: "#FFFFFF",
        }}
      >
        Старт
      </Button>
      <Button
        variant="ghost"
        onClick={onEnd}
        className="font-inter hover:bg-gray-100 transition-colors cursor-pointer"
        style={{
          width: "456px",
          height: "50px",
          minWidth: "50px",
          borderRadius: "10px",
          padding: "15px 12px",
          fontSize: "17px",
          color: "#303030",
        }}
      >
        Назад
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
      <h1
        className="font-manrope font-bold"
        style={{
          color: "#0D0BCC",
          fontSize: "96px",
          fontWeight: 700,
          paddingTop: "105px",
          paddingBottom: "140px",
        }}
      >
        {title}
      </h1>
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
    <div className="flex h-screen w-full items-center justify-center bg-white">
      <div className="text-9xl font-bold font-manrope" style={{ color: "#0D0BCC" }}>{count}</div>
    </div>
  );
};

interface QuizPageProps {
  question?: Question & { isLast: boolean };
  onNext: () => void;
  onFinish: () => void;
  participantsWithAnswersCount: number;
  participantsCount: number;
  currentQustionIndex: number;
  qustionsCount: number;
}

export function QuizPage({
                           question,
                           onNext,
                           onFinish,
                           participantsWithAnswersCount,
                           participantsCount,
                           currentQustionIndex,
                           qustionsCount,
                         }: QuizPageProps) {
  const [showAnswers, setShowAnswers] = useState(false);

  const handleShowAnswers = () => {
    setShowAnswers(true);
  };

  const handleNext = () => {
    setShowAnswers(false);
    onNext();
  };

  if (!question) return <></>;

  // Determine answer layout based on number of answers
  const answerColumns = question.answers.length <= 2 ? 1 : 2;
  const isOddNumber = question.answers.length % 2 !== 0;

  return (
    <div
      className={`mx-auto p-6 bg-white min-h-screen flex-1 flex flex-col ${question.media_path ? "" : "justify-between"}`}>
      <p>
        Ответов {participantsWithAnswersCount} из {participantsCount}
      </p>
      <p>
        Раунд {currentQustionIndex} из {qustionsCount}
      </p>

      {/* Question Section */}
      <div className={`mb-12 text-center ${question.media_path ? "" : "mt-auto"}`}>
        <h1 className="text-[64px] font-bold mb-8 font-manrope" style={{ color: "#0D0BCC", lineHeight: "70px" }}>
          {question.title}
        </h1>
        {question.description && (
          <p className="text-2xl font-manrope">
            {question.description}
          </p>
        )}
      </div>

      {/* Media (if exists) */}
      {question.media_path && (
        <div className="mb-12 flex justify-center">
          <img
            src={question.media_path}
            alt="Question media"
            className="max-h-96 rounded-lg object-contain"
          />
        </div>
      )}

      {/* Bottom section with answers and buttons */}
      <div className="mt-auto">
        {/* Answers Grid */}
        <div className={`grid ${answerColumns === 1 ? "grid-cols-1" : "grid-cols-2"} gap-6 mb-12`}>
          {question.type !== "text" && question.answers
            .sort((a, b) => a.order - b.order)
            .map((answer, index) => (
              <div
                key={answer.text}
                className={`relative flex items-center p-[25px_40px] rounded-lg shadow-[0px_2px_17.9px_1px_rgba(66,66,66,0.2)] ${
                  isOddNumber && index === question.answers.length - 1 ? "col-span-2 mx-auto w-3/4" : "w-full"
                } ${
                  showAnswers && answer.is_correct
                    ? "bg-green-100 border-2 border-green-500"
                    : "bg-white"
                }`}
                style={{ height: "96px" }}
              >
                {/* Answer number indicator */}
                <div
                  className="absolute left-8 flex items-center justify-center rounded-lg bg-[#0D0BCC] text-white font-manrope text-[32px] font-bold"
                  style={{ width: "44px", height: "44px" }}
                >
                  {index + 1}
                </div>

                {/* Answer text */}
                <p className="text-[40px] font-manrope ml-15 font-medium">
                  {answer.text}
                </p>
              </div>
            ))}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-8">
          <Button
            size="lg"
            className="w-[292px] h-[50px] font-inter font-semibold text-[20px] text-[#0D0BCC] hover:bg-white cursor-pointer border-1 border-solid border-[#0D0BCC]"
            onClick={handleShowAnswers}
            disabled={showAnswers}
          >
            Показать ответ
          </Button>

          <Button
            size="lg"
            className="w-[292px] h-[50px] font-inter font-semibold text-[20px] text-[#FFFFFF] bg-[#0D0BCC] cursor-pointer hover:bg-[#0D0BCC]"
            onClick={question.isLast ? onFinish : handleNext}
          >
            {question.isLast ? "Завершить" : "Следующий вопрос"}
          </Button>
        </div>
      </div>
    </div>
  );
}

type Results = Array<{ participant: Participant, total_points: number }>

interface QuizResultsProps {
  results: Results;
  quizTitle: string;
  onNext: () => void;
}

export function QuizResults({ results, quizTitle, onNext }: QuizResultsProps) {
  const [showNextButton, setShowNextButton] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNextButton(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const filteredResults = results.filter(result => result.participant.role !== "host");

  const winners = filteredResults.slice(0, 3);
  const [firstPlace, secondPlace, thirdPlace] = winners;

  return (
    <div className="flex flex-col items-center min-h-screen p-6 bg-gray-50">
      <h1 className="text-3xl font-bold mb-8 text-center">{quizTitle}</h1>

      <div className="flex justify-center items-end gap-8 mb-12">
        {/* 2 место */}
        {secondPlace && (
          <div className="flex flex-col items-center">
            <div
              className="bg-silver-500 h-48 w-40 rounded-t-lg flex flex-col items-center justify-end p-4 bg-gray-300">
              <Avatar className="w-20 h-20 mb-2">
                <AvatarImage src={secondPlace.participant.user.photo_url} />
              </Avatar>
              <span className="font-semibold">
                {secondPlace.participant.user.username}
              </span>
              <span className="text-sm text-gray-600">
                {secondPlace.total_points} pts
              </span>
            </div>
            <div className="bg-gray-400 text-white px-4 py-2 rounded-b-lg w-full text-center">
              2nd Place
            </div>
          </div>
        )}

        {/* 1 место */}
        {firstPlace && (
          <div className="flex flex-col items-center">
            <div
              className="bg-gold-500 h-64 w-48 rounded-t-lg flex flex-col items-center justify-end p-4 bg-yellow-400">
              <Avatar className="w-24 h-24 mb-2">
                <AvatarImage src={firstPlace.participant.user.photo_url} />
              </Avatar>
              <span className="font-semibold">
                {firstPlace.participant.user.username}
              </span>
              <span className="text-sm text-gray-600">
                {firstPlace.total_points} pts
              </span>
            </div>
            <div className="bg-yellow-600 text-white px-4 py-2 rounded-b-lg w-full text-center">
              1st Place
            </div>
          </div>
        )}

        {/* 3 место */}
        {thirdPlace && (
          <div className="flex flex-col items-center">
            <div
              className="bg-bronze-500 h-40 w-36 rounded-t-lg flex flex-col items-center justify-end p-4 bg-amber-700">
              <Avatar className="w-16 h-16 mb-2">
                <AvatarImage src={thirdPlace.participant.user.photo_url} />
              </Avatar>
              <span className="font-semibold text-white">
                {thirdPlace.participant.user.username}
              </span>
              <span className="text-sm text-gray-200">
                {thirdPlace.total_points} pts
              </span>
            </div>
            <div className="bg-amber-800 text-white px-4 py-2 rounded-b-lg w-full text-center">
              3rd Place
            </div>
          </div>
        )}
      </div>

      {showNextButton && (
        <Button onClick={onNext} className="mt-4">
          Далее
        </Button>
      )}
    </div>
  );
}

interface AllParticipantsProps {
  results: Results;
  quizTitle: string;
  sessionId: string;
  currentOrganizationId: string;
  quizId: string;
}

export function AllParticipants({
                                  results,
                                  quizTitle,
                                  sessionId,
                                  currentOrganizationId,
                                  quizId,
                                }: AllParticipantsProps) {
  // Сортируем участников по очкам
  const sortedResults = [...results].sort(
    (a, b) => b.total_points - a.total_points,
  );

  const navigate = useNavigate();

  const mutation = useMutation(exportResults);

  async function handleExportResults(sessionId: string) {
    try {
      mutation.mutate({
        organizationId: currentOrganizationId as string,
        quizId: quizId as string,
        sessionId: sessionId,
      });

      if (!mutation?.data?.data) return;

      const url = URL.createObjectURL(new Blob([mutation?.data?.data]));

      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", `sessions_expoerted_${dayjs().format("DD.MM.YYYY_HH:mm")}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Ошибка при экспорте результатов:", error);
    }
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-6 bg-gray-50">
      <h1 className="text-3xl font-bold mb-8 text-center">
        {quizTitle} - Все участники
      </h1>

      <div className="w-full max-w-2xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Место</TableHead>
              <TableHead>Участник</TableHead>
              <TableHead>Очки</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedResults.map((result, index) => (
              <TableRow key={index}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={result.participant.user.photo_url} />
                    </Avatar>
                    <span>{result.participant.user.username}</span>
                  </div>
                </TableCell>
                <TableCell>{result.total_points}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Button onClick={() => handleExportResults(sessionId)}>Экспорт</Button>
      <Button onClick={() => navigate(`/sessions/${quizId}`)}>Закрыть</Button>
    </div>
  );
}

type Stages = "start" | "counter" | "questions" | "results";
const botName = import.meta.env.VITE_BOT_NAME;

function StartQuiz() {
  const {
    quiz,
    isLoading,
    error,
    session,
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
  const [results, setResults] = useState<Results | null>(null);
  const [showAllParticipants, setShowAllParticipants] = useState(false);
  const [participantsIdWithAnswers, setParticipantsIdWithAnswers] = useState([]);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [currentQustionIndex, setCurrentQustionIndex] = useState(1);
  const { id: quizId } = useParams();

  useEffect(() => {
    console.log(session?.id)
    if(session?.id || isLoading) return

    console.log('qqqq')
    createSessionMutate({
      organizationId: currentOrganizationId as string,
      quizId: quizId as string,
    });
  }, [createSessionMutate, currentOrganizationId, quizId,session, isLoading]);

  useEffect(() => {
    setMessageHandlers(prev => ({
      ...prev as MessageHandlers,
      "join": (data) => {
        setParticipants(prev => {
            const a = prev.map(el => el.participant_id);
            if (a.includes(data.participant_id)) return prev;
            setParticipantsCount(prev => prev + 1);
            return [...prev, data as participantsForView];
          },
        );
      },
      "leave": (data) => {
        if (!(data as any)?.participant_id) return;

        setParticipants(prev => prev.filter(el => el.participant_id !== (data as any).participant_id));
      },
      "cancel": () => {
        navigate("/", { replace: true });
      },
      "start": (data) => {
        setStage("counter");
        if ((data as any)?.question)
          setCurrentQuestion({ ...(data as any)?.question, isLast: (data as any).is_last_question });
      },
      "next": (data) => {
        if ((data as any)?.question) {
          setCurrentQuestion({ ...(data as any)?.question, isLast: (data as any).is_last_question });
          setParticipantsIdWithAnswers([]);
          setCurrentQustionIndex(prev => prev + 1);
        }
      },
      "finish": (data) => {
        setResults(data.results as Results);
        setCurrentQustionIndex(1);
        setParticipantsIdWithAnswers([]);
        setStage("results");
      },
      "answer": (data) => {
        const id = data.participant_id;
        setParticipantsIdWithAnswers(prev => {
          if (prev.includes(id)) return prev;

          return [...prev, !prev.includes(id) ? id : ""];
        });
      },
    }));
  }, [setMessageHandlers, navigate]);


  const handleEndQuiz = () => {
    try {
      endQuiz();
    } catch (e) {
      console.log("WebSocket might be closed, but we're navigating anyway");
    }
    navigate("/", { replace: true });
  };

  const { join_code } = session || {};
  const hasParticipants = participants.some(p => p.role === "participant" || p.role === "guest");

  if (stage === "start") return (
    <div className="bg-white">
      <div className="min-h-screen max-w-6xl mx-auto bg-white">
        <QuizSessionHeader title={quiz?.name} />

        <div className="grid grid-cols-2 gap-6 px-6">
          <QuizSessionView sessionCode={join_code} />
          <QuizParticipantsList participants={participants} />
        </div>

        <QuizSessionControls
          onStart={startQuiz}
          onEnd={handleEndQuiz}
          sessionStatus={session?.status || "waiting"}
          hasParticipants={hasParticipants}
        />
      </div>
    </div>
  );

  if (stage === "counter") return (
    <Counter next={setStage} />
  );

  if (stage === "questions") return (
    <QuizPage
      question={currentQuestion}
      onNext={nextQuestion}
      onFinish={finishQuiz}
      participantsWithAnswersCount={participantsIdWithAnswers.length}
      currentQustionIndex={currentQustionIndex}
      qustionsCount={quiz?.questions_count}
      participantsCount={(participantsCount / 2) - 1}
    />
  );

  if (stage === "results" && results && quiz) return (
    <>
      {!showAllParticipants ? (
        <QuizResults
          results={results}
          quizTitle={quiz?.name}
          onNext={() => setShowAllParticipants(true)}
        />
      ) : (
        <AllParticipants
          results={results}
          quizTitle={quiz?.name}
          sessionId={session.id}
          currentOrganizationId={currentOrganizationId}
          quizId={quizId}
        />
      )}
    </>
  );
}

export default StartQuiz;
