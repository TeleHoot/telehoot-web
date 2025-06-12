import { useContext, useEffect, useState } from "react";
import { OrganizationContext } from "@app/providers/AppRouter/AppRouter.config";
import { AllParticipants, QuizResults } from "@pages/StartQuiz/StartQuiz";

import { useQuery } from 'react-query';
import { CreateSessionData, getSession, getSessionResults } from "@entity/Session";
import { useNavigate, useSearchParams } from "react-router-dom";

export const useSession = (
  data: CreateSessionData & { sessionId: string }
) => {
  return useQuery({
    queryKey: ['session', data],
    queryFn: () => getSession(data),
  });
};

export const useSessionResults = (
  data: CreateSessionData & { sessionId: string }
) => {
  return useQuery({
    queryKey: ['results', data],
    queryFn: () => getSessionResults(data),
  });
};

const Results = () => {
  const organizationContext = useContext(OrganizationContext);
  const currentOrganization = organizationContext?.activeOrganization;

  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId') || '';
  const quizId = searchParams.get('quizId') || '';
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessionId || !quizId) {
      // Можно редиректить, например, на главную:
      navigate('/not-found', { replace: true });
      // Или показать сообщение пользователю:
      // alert('Missing required query parameters');
    }
  }, [sessionId, quizId, navigate]);
  const [showAllParticipants, setShowAllParticipants] = useState(false);

  const { data: sessionData, isLoading, error } = useSession({
    organizationId: currentOrganization?.id || '',
    quizId,
    sessionId,
  });

  const { data: sessionResultsData } = useSessionResults({
    organizationId: currentOrganization?.id || '',
    quizId,
    sessionId,
  });


  if (isLoading) return <div>Loading...</div>;
  if (error || !sessionData) return <div>Error loading session data</div>;// Распаковываем данные (зависит от структуры твоего blob json)

  return (
    <>
      {!showAllParticipants ? (
        <QuizResults
          results={sessionResultsData.data}
          quizTitle={sessionData.data.quiz.name}
          onNext={() => setShowAllParticipants(true)}
        />
      ) : (
        <AllParticipants
          results={sessionResultsData.data}
          quizTitle={sessionData.data.quiz.name}
          sessionId={sessionData.data.id}
          currentOrganizationId={currentOrganization?.id}
          quizId={quizId}
        />
      )}
    </>
  );
};

export default Results;
