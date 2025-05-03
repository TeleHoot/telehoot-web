import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader } from "lucide-react";

import { Button } from "@shared/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs";
import { Input } from "@shared/components/ui/input";
import { Textarea } from "@shared/components/ui/textarea";
import { Label } from "@shared/components/ui/label";
import { useMutation, useQueryClient } from "react-query";
import { Answer, createQuestion, Question, QuestionCreate, QuestionTypes, updateQuestion } from "@entity/Question";
import { createQuiz } from "@entity/Quiz";
import { OrganizationContext } from "@app/providers/AppRouter/AppRouter.config";
import { Separator } from "@shared/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shared/components/ui/select";
import debounce from "debounce";
import { Checkbox } from "@shared/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@shared/components/ui/radio-group";

const initialQuestion: QuestionCreate = {
  quiz_id: "",
  title: " ",
  type: "single_choice",
  weight: 1,
  order: 1,
  answers: [{
    text: "Вариант 1",
    is_correct: true,
    order: 1,
  }],
};

const QUESTIONS_PER_PAGE = 8;

const CreateQuiz = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("info");
  const [quizId, setQuizId] = useState<string>();
  const organizationContext = useContext(OrganizationContext);
  const currentOrganizationId = organizationContext?.activeOrganization.id;

  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question>();
  const [currentPage, setCurrentPage] = useState(0);

  // Мутация для создания квиза
  const createQuizMutation = useMutation(createQuiz, {
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      setQuizId(data.data.id);
      createQuestionMutation.mutate({ ...initialQuestion, quiz_id: data.data.id });
      setActiveTab("questions");
    },
  });

  const handleCreateQuiz = () => {
    createQuizMutation.mutate({
      name: name,
      description: description,
      organization_id: currentOrganizationId as string,
    });
  };

  const createQuestionMutation = useMutation(createQuestion, {
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      setCurrentQuestion(data.data);
      console.log(data)
      setQuestions(prev => [...prev, data.data]);
      // Переходим на последнюю страницу при добавлении нового вопроса
      setCurrentPage(Math.floor((questions.length) / QUESTIONS_PER_PAGE));
    },
  });

  const updateQuestionMutation = useMutation(updateQuestion, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
    },
  });

  const handleAddQuestion = () => {
    createQuestionMutation.mutate({ ...initialQuestion, quiz_id: quizId });
  };

  const debouncedUpdate = useRef(
    debounce((questionData: Question, quizId?: string) => {
      updateQuestionMutation.mutate({
        ...questionData,
        quiz_id: quizId,
        questionId: questionData.id,
      });
    }, 500),
  ).current;

  useEffect(() => {
    if (currentQuestion) {
      debouncedUpdate(currentQuestion, quizId);
    }
  }, [currentQuestion, debouncedUpdate, quizId]);

  const handleAddAnswer = () => {
    if (!currentQuestion) return;

    const order = currentQuestion.answers.length;

    const answers: Answer[] = [...currentQuestion?.answers, {
      order: order,
      is_correct: false,
      text: `Вариант ${order + 1}`,
    }];

    setCurrentQuestion((prev) => ({ ...prev as Question, answers }));
  };

  const handleAnswerChange = (index: number, value: string) => {
    if (!currentQuestion) return;

    setCurrentQuestion((prev) => {
      const updatedAnswers = [...(prev as Question).answers];
      updatedAnswers[index] = {
        ...updatedAnswers[index],
        text: value,
      };

      return { ...prev as Question, answers: updatedAnswers };
    });
  };

  const handleRemoveAnswer = (deleteIndex: number) => {
    if (!currentQuestion) return;

    const answers: Answer[] = currentQuestion?.answers?.filter((el, index) => index !== deleteIndex);

    setCurrentQuestion((prev) => ({ ...prev as Question, answers }));
  };

  useEffect(() => {
    if (currentQuestion) {
      setQuestions(prevQuestions =>
        prevQuestions.map(q =>
          q.id === currentQuestion.id ? currentQuestion : q
        )
      );
    }
  }, [currentQuestion]);

  const handleQuestionSelect = (question: Question) => {
    // Находим актуальную версию вопроса из массива questions
    const actualQuestion = questions.find(q => q.id === question.id) || question;
    setCurrentQuestion(actualQuestion);
  };
  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const paginatedQuestions = questions.slice(
    currentPage * QUESTIONS_PER_PAGE,
    (currentPage + 1) * QUESTIONS_PER_PAGE,
  );

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleCorrectAnswerChange = (index: number, isCorrect: boolean) => {
    if (!currentQuestion) return;

    setCurrentQuestion(prev => {
      if (!prev) return prev;

      const updatedAnswers = [...prev.answers];

      // Для single_choice сбрасываем все is_correct кроме текущего
      if (prev.type === "single_choice") {
        updatedAnswers.forEach((answer, i) => {
          updatedAnswers[i] = {
            ...answer,
            is_correct: i === index ? isCorrect : false
          };
        });
      }
      // Для multiple_choice просто меняем текущий
      else if (prev.type === "multiple_choice") {
        updatedAnswers[index] = {
          ...updatedAnswers[index],
          is_correct: isCorrect
        };
      }

      return {
        ...prev,
        answers: updatedAnswers
      };
    });
  };

  return (
    <div className="flex h-full gap-6">
      <div className="flex-1">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Создание квиза</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Основная информация</TabsTrigger>
            <TabsTrigger value="questions" disabled={!quizId}>
              Вопросы
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <div className="space-y-6 mt-6">
              <div className="space-y-2">
                <Label htmlFor="title">Название квиза</Label>
                <Input
                  id="title"
                  placeholder="Введите название"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  placeholder="Введите описание квиза"
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  rows={5}
                />
              </div>

              <Button
                onClick={handleCreateQuiz}
                disabled={!name}
                className="w-full"
              >
                Далее
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="questions">
            {/* Пагинация вопросов */}
            <div className="mb-6 flex gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevPage}
                disabled={currentPage === 0}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <div className="flex flex-wrap gap-2">
                {paginatedQuestions.map((question, index) => (
                  <Button
                    key={question.id}
                    variant={currentQuestion?.id === question.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleQuestionSelect(question)}
                    className="min-w-[40px] h-10"
                  >
                    {currentPage * QUESTIONS_PER_PAGE + index + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddQuestion}
                  className="min-w-[40px] h-10"
                >
                  +
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages - 1 || totalPages === 0}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-6 mt-6">
              <div className="space-y-2">
                <Label htmlFor="question-title">Текст вопроса</Label>
                <Input
                  id="question-title"
                  placeholder="Введите вопрос"
                  value={currentQuestion?.title}
                  onChange={(e) =>
                    setCurrentQuestion({ ...currentQuestion as Question, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="question-description">Пояснение к вопросу</Label>
                <Textarea
                  id="question-description"
                  placeholder="Введите пояснение (необязательно)"
                  value={currentQuestion?.description}
                  onChange={(e) =>
                    setCurrentQuestion({ ...currentQuestion as Question, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
                <div className="space-y-2">
                  <Label htmlFor="question-weight">Вес вопроса</Label>
                  <Input
                    id="question-weight"
                    type="number"
                    min="1"
                    value={currentQuestion?.weight}
                    onChange={(e) =>
                      setCurrentQuestion({ ...currentQuestion as Question, weight: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Медиафайлы</Label>
                <Input
                  type="file"
                  multiple
                  onChange={(e) => {
                    // if (e.target.files) {
                    //   setCurrentQuestion({
                    //     ...currentQuestion,
                    //     media_path: Array.from(e.target.files),
                    //   });
                    // }
                  }}
                />
              </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="question-type">Тип вопроса</Label>
                <Select
                  value={currentQuestion?.type}
                  onValueChange={(value: QuestionTypes) =>
                    setCurrentQuestion({ ...currentQuestion as Question, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_choice">Один ответ</SelectItem>
                    <SelectItem value="multiple_choice">Несколько ответов</SelectItem>
                    <SelectItem value="text">Текстовый ответ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {currentQuestion?.type === "text" ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Правильные текстовые ответы</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddAnswer}
                    >
                      Добавить вариант ответа
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {currentQuestion?.answers?.map((answer, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={answer.text}
                          onChange={(e) => handleAnswerChange(index, e.target.value)}
                          placeholder={`Вариант ответа ${index + 1}`}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveAnswer(index)}
                          disabled={currentQuestion.answers.length <= 1}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Варианты ответов</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddAnswer}
                    >
                      Добавить вариант
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {currentQuestion?.type === "single_choice" ? (
                      <RadioGroup>
                        {currentQuestion?.answers?.map((option, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <RadioGroupItem
                              value={index.toString()}
                              checked={option.is_correct}
                              onClick={() => handleCorrectAnswerChange(index, true)}
                            />
                            <Input
                              value={option.text}
                              onChange={(e) => handleAnswerChange(index, e.target.value)}
                              placeholder={`Вариант ${index + 1}`}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveAnswer(index)}
                              disabled={currentQuestion.answers.length <= 1}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </RadioGroup>
                    ) : (
                      <>
                        {currentQuestion?.answers?.map((option, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Checkbox
                              checked={option.is_correct}
                              onCheckedChange={(checked) =>
                                handleCorrectAnswerChange(index, Boolean(checked))
                              }
                            />
                            <Input
                              value={option.text}
                              onChange={(e) => handleAnswerChange(index, e.target.value)}
                              placeholder={`Вариант ${index + 1}`}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveAnswer(index)}
                              disabled={currentQuestion.answers.length <= 1}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {updateQuestionMutation.isLoading ?
              <span className={"flex gap-2"}><Loader />Загрузка</span> : "Данные сохранены"}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CreateQuiz;
