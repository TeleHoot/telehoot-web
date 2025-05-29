import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight, Loader2, LockKeyhole, Trash2, X } from "lucide-react";
import { useDropzone } from "react-dropzone";

import { Button } from "@shared/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs";
import { Input } from "@shared/components/ui/input";
import { Textarea } from "@shared/components/ui/textarea";
import { Label } from "@shared/components/ui/label";
import { useMutation, useQuery, useQueryClient } from "react-query";
import {
  Answer,
  createQuestion,
  deleteQuestion,
  getQuizQuestion,
  Question,
  QuestionCreate,
  QuestionTypes,
  updateQuestion,
} from "@entity/Question";
import { createQuiz, getQuiz, updateQuiz } from "@entity/Quiz";
import { OrganizationContext } from "@app/providers/AppRouter/AppRouter.config";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shared/components/ui/select";
import debounce from "debounce";
import { Checkbox } from "@shared/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@shared/components/ui/radio-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@shared/components/ui/tooltip";

const initialQuestion: QuestionCreate = {
  quiz_id: "",
  title: "Текст вопроса",
  type: "single_choice",
  description: "",
  weight: 1,
  order: 1,
  answers: [{
    text: "Вариант 1",
    is_correct: true,
    order: 1,
  }],
};

const QUESTIONS_PER_PAGE = 8;

const tabTriggerClass = `
  px-0 pb-3 relative shadow-none rounded-none
  text-[#71717A] font-medium font-inter
  cursor-pointer
  data-[state=active]:text-[#09090B]
  data-[state=active]:shadow-none
  data-[state=active]:after:content-['']
  data-[state=active]:after:absolute
  data-[state=active]:after:bottom-0
  data-[state=active]:after:left-0
  data-[state=active]:after:w-full
  data-[state=active]:after:h-[3px]
  data-[state=active]:after:bg-[#0D0BCC]
  hover:text-[#09090B]
`;

const CreateQuiz = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id: urlQuizId } = useParams();
  console.log(urlQuizId);
  const [activeTab, setActiveTab] = useState("info");
  const [quizId, setQuizId] = useState<string | undefined>(urlQuizId);
  const organizationContext = useContext(OrganizationContext);
  const currentOrganizationId = organizationContext?.activeOrganization.id;

  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question>();
  const [currentPage, setCurrentPage] = useState(0);

  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("Файл не выбран");

  const [saveTime, setSaveTime] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Запрос для получения данных квиза, если есть quizId в URL
  const { data: quizData } = useQuery(
    ["quiz"],
    () => getQuiz({ organizationId: currentOrganizationId, quizId }),
    {
      enabled: !!quizId,
      onSuccess: (data) => {
        console.log(data);
        setName(data.data.name);
        setDescription(data.data.description);
      },
    },
  );

  // Запрос для получения вопросов квиза, если есть quizId в URL
  const { data: questionsData } = useQuery(
    ["questions"],
    () => getQuizQuestion(quizId as string),
    {
      enabled: !!quizId,
      onSuccess: (data) => {
        setQuestions(data.data);
        if (data.data.length > 0) {
          setCurrentQuestion(data.data[0]);
          setPreview(data.data[0].media_path || null);
          setFileName(data.data[0].media_path ? "Изображение загружено" : "Файл не выбран");
        }
      },
    },
  );

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setCurrentQuestion(prev => ({ ...prev as Question, image: file }));
      setPreview(URL.createObjectURL(file));
      setFileName(file.name);
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: 1,
  });

  // Мутация для создания квиза
  const createQuizMutation = useMutation(createQuiz, {
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      setQuizId(data.data.id);
      createQuestionMutation.mutate({ ...initialQuestion, quiz_id: data.data.id });
      setActiveTab("questions");
    },
  });

  // Мутация для обновления квиза
  const updateQuizMutation = useMutation(updateQuiz, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz", quizId] });
    },
  });

  const handleSaveQuizInfo = () => {
    if (quizId) {
      if (quizData?.data.description !== description || quizData?.data.name !== name)
        // Обновляем существующий квиз
        updateQuizMutation.mutate({
          quizId,
          name,
          image,
          description,
          organization_id: currentOrganizationId as string,
        });
      else {
        setActiveTab("questions");
      }
    } else {
      // Создаем новый квиз
      createQuizMutation.mutate({
        name: name,
        description: description,
        organization_id: currentOrganizationId as string,
      });
    }
  };

  const createQuestionMutation = useMutation(createQuestion, {
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["questions", quizId] });
      setCurrentQuestion(data.data);
      setQuestions(prev => [...prev, data.data]);
      // Переходим на последнюю страницу при добавлении нового вопроса
      setCurrentPage(Math.floor((questions.length) / QUESTIONS_PER_PAGE));
    },
  });

  const updateQuestionMutation = useMutation(updateQuestion, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions", quizId] });
    },
  });

  const handleAddQuestion = () => {
    if (!quizId) return;
    createQuestionMutation.mutate({ ...initialQuestion, quiz_id: quizId });
    setPreview(null);
    setFileName("Файл не выбран");
  };

  const debouncedUpdate = useRef(
    debounce((questionData: Question, quizId?: string) => {
      if (!quizId) return;
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

  useEffect(() => {
    if (updateQuestionMutation.isLoading) {
      setIsSaving(true);
    } else if (!updateQuestionMutation.isLoading && currentQuestion) {
      const now = new Date();
      const formattedTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setSaveTime(formattedTime);
      setIsSaving(false);
    }
  }, [updateQuestionMutation.isLoading, currentQuestion]);

  console.log(currentQuestion);

  const handleAddAnswer = () => {
    if (!currentQuestion) return;

    const order = currentQuestion.answers.length;

    if (order >= 4) return;

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
          q.id === currentQuestion.id ? currentQuestion : q,
        ),
      );
    }
  }, [currentQuestion]);

  const handleQuestionSelect = (question: Question) => {
    // Находим актуальную версию вопроса из массива questions
    const actualQuestion = question;
    setCurrentQuestion(actualQuestion);
    setPreview(actualQuestion.media_path || null);
    setFileName(actualQuestion.media_path ? "Изображение загружено" : "Файл не выбран");
  };

  const handleNextQuestion = () => {
    if (!currentQuestion) return;
    const currentIndex = questions.findIndex(q => q.id === currentQuestion.id);
    if (currentIndex < questions.length - 1) {
      const nextQuestion = questions[currentIndex + 1];
      setCurrentQuestion(nextQuestion);
      setPreview(nextQuestion.media_path || null);
      setFileName(nextQuestion.media_path ? "Изображение загружено" : "Файл не выбран");
    }
  };

  const handlePrevQuestion = () => {
    if (!currentQuestion) return;
    const currentIndex = questions.findIndex(q => q.id === currentQuestion.id);
    if (currentIndex > 0) {
      const prevQuestion = questions[currentIndex - 1];
      setCurrentQuestion(prevQuestion);
      setPreview(prevQuestion.media_path || null);
      setFileName(prevQuestion.media_path ? "Изображение загружено" : "Файл не выбран");
    }
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
            is_correct: i === index ? isCorrect : false,
          };
        });
      }
      // Для multiple_choice просто меняем текущий
      else if (prev.type === "multiple_choice") {
        updatedAnswers[index] = {
          ...updatedAnswers[index],
          is_correct: isCorrect,
        };
      }

      return {
        ...prev,
        answers: updatedAnswers,
      };
    });
  };

  const handleRemoveImage = () => {
    setCurrentQuestion(prev => ({ ...prev as Question, media_path: "" }));
    setPreview(null);
    setFileName("Файл не выбран");
  };

  const mutation = useMutation(deleteQuestion, {
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["questions", quizId] });

    },
  });

  const handleDelete = (questionId: string) => {
    mutation.mutate({ quizId, questionId });
    setQuestions(prevQuestions => {
      const updatedQuestions = prevQuestions.filter(q => q.id !== questionId);

      // Находим индекс удаляемого вопроса
      const deletedIndex = prevQuestions.findIndex(q => q.id === questionId);

      // Определяем новый текущий вопрос
      let newCurrentQuestion;

      if (prevQuestions.length === 1) {
        // Если это последний вопрос, оставляем undefined или null
        newCurrentQuestion = null;
      } else if (deletedIndex > 0) {
        // Берем предыдущий вопрос (ближайший перед удаленным)
        newCurrentQuestion = prevQuestions[deletedIndex - 1];
      } else {
        // Если удаляем первый вопрос, берем следующий (новый первый)
        newCurrentQuestion = prevQuestions[deletedIndex + 1];
      }

      setCurrentQuestion(newCurrentQuestion);

      return updatedQuestions;
    });
  };

  return (
    <div className="container mx-auto py-8 max-w-[1000px] px-4">
      <div className="flex items-center gap-4 mb-10">
        <Button
          variant="ghost"
          onClick={() => navigate(`/organization/${currentOrganizationId}/quizzes`)}
          className="text-[#707579] font-manrope text-[14px] font-medium p-0 hover:bg-transparent cursor-pointer"
        >
          <ChevronLeft className="h-5 w-5" />
          Вернуться к квизам
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => {
        if (value === "questions" && !quizId) return;
        setActiveTab(value);
      }} className="text-[16px]">
        <TabsList className="flex gap-8 p-0 bg-transparent">
          <TabsTrigger value="info" className={tabTriggerClass}>
            Основная информация
          </TabsTrigger>
          {!quizId ? (
            <TooltipProvider delayDuration={1}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger
                    value="questions"
                    className={`${tabTriggerClass} flex items-center gap-2 opacity-50 cursor-not-allowed`}
                    onClick={(e) => e.preventDefault()}
                  >
                    <LockKeyhole className="h-4 w-4" />
                    Вопросы
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent
                  className="bg-white text-[#09090B] border border-[#E5E7EB] font-inter text-[14px] font-normal [&>svg]:hidden"
                >
                  <p>Доступ к вопросам откроется после создания квиза</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <TabsTrigger value="questions" className={tabTriggerClass}>
              Вопросы
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="info">
          <div className="space-y-6 mt-6">
            <div className="space-y-2">
              <Input
                id="title"
                placeholder="Название квиза*"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                className="w-[418px] text-[#18191B] placeholder:text-[#71717A] [&>input]:text-[#18191B] selection:bg-[#0D0BCC] selection:text-white"
              />
            </div>

            <div className="space-y-2">
              <Textarea
                id="description"
                placeholder="Описание квиза"
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                rows={5}
                className="w-[418px] text-[#18191B] placeholder:text-[#71717A] [&>textarea]:text-[#18191B] selection:bg-[#0D0BCC] selection:text-white"
              />
            </div>

            <Button
              onClick={handleSaveQuizInfo}
              disabled={!name}
              className="w-[105px] h-[40px] font-inter hover:bg-[#0A09A3] transition-colors cursor-pointer"
              style={{
                backgroundColor: !name ? "#A2ACB0" : "#0D0BCC",
                color: "#FAFAFA",
              }}
            >
              {quizId && quizData?.data.description !== description || quizData?.data.name !== name ? "Сохранить" : "Далее"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="questions">
          {/* Пагинация вопросов */}
          <div className="mb-6 flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevQuestion}
              disabled={!currentQuestion || questions.findIndex(q => q.id === currentQuestion.id) === 0}
            >
              <ChevronLeft className="h-[20px] w-[20px]" />
            </Button>

            <div className="flex flex-wrap gap-2">
              {paginatedQuestions.map((question, index) => (
                <Button
                  key={question.id}
                  variant={currentQuestion?.id === question.id ? "outline" : "ghost"}
                  size="sm"
                  onClick={() => handleQuestionSelect(question)}
                  className={`min-w-[40px] min-h-[40px] font-medium text-[14px] text-[#09090B] font-inter ${
                    currentQuestion?.id === question.id ? "border-[#0D0BCC]" : ""
                  }`}
                >
                  {currentPage * QUESTIONS_PER_PAGE + index + 1}
                </Button>
              ))}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextQuestion}
                disabled={!currentQuestion || questions.findIndex(q => q.id === currentQuestion.id) === questions.length - 1}
              >
                <ChevronRight className="h-[20px] w-[20px]" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddQuestion}
                className="min-w-[40px] h-10 font-inter font-medium text-[#A2ACB0] text-[14px] cursor-pointer"
              >
                + Добавить вопрос
              </Button>
            </div>
          </div>

          {questions.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-[#707579] font-inter text-[16px]">
                Нет вопросов. Нажмите "Добавить вопрос", чтобы создать первый.
              </p>
            </div>
          ) : (
            <div className="flex gap-6">
              <div className="w-[418px] space-y-6">
                <div className="space-y-2">
                  <Input
                    id="question-title"
                    placeholder="Текст вопроса"
                    value={currentQuestion?.title}
                    onChange={(e) =>
                      setCurrentQuestion({ ...currentQuestion as Question, title: e.target.value })
                    }
                    className="w-full text-[#18191B] placeholder:text-[#71717A] [&>input]:text-[#18191B] selection:bg-[#0D0BCC] selection:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Textarea
                    id="question-description"
                    placeholder="Текст инструкции"
                    value={currentQuestion?.description}
                    onChange={(e) =>
                      setCurrentQuestion({ ...currentQuestion as Question, description: e.target.value })
                    }
                    rows={3}
                    className="w-full text-[#18191B] placeholder:text-[#71717A] [&>textarea]:text-[#18191B] selection:bg-[#0D0BCC] selection:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <div {...getRootProps()}
                       className="w-full h-[40px] px-4 border border-input rounded-md flex items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="font-inter text-[14px] text-[#09090B] font-medium">Загрузить файл</span>
                    </div>
                    <span className="font-inter text-[14px] text-[#A2ACB0] font-normal truncate max-w-[180px]">
                      {fileName}
                    </span>
                    <input {...getInputProps()} />
                  </div>
                  {preview && (
                    <div className="flex items-center gap-2 mt-2">
                      <img src={preview} alt="Preview" className="h-10 w-10 object-cover rounded-md" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveImage}
                        className="text-[#0D0BCC] hover:underline"
                      >
                        Удалить
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <Label className="text-[#707579] font-inter text-[14px] font-normal">Ответы</Label>
                  <div className="flex gap-4">
                    <Select
                      value={currentQuestion?.type}
                      onValueChange={(value: QuestionTypes) =>
                        setCurrentQuestion({ ...currentQuestion as Question, type: value })
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Выберите тип" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="single_choice">Один ответ</SelectItem>
                        <SelectItem value="multiple_choice">Несколько ответов</SelectItem>
                        <SelectItem value="text">Текстовый ответ</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      id="question-weight"
                      type="number"
                      min="1"
                      value={currentQuestion?.weight}
                      onChange={(e) =>
                        setCurrentQuestion({ ...currentQuestion as Question, weight: Number(e.target.value) })
                      }
                      className="w-[128px] text-[#18191B] placeholder:text-[#71717A] focus:text-[#18191B] selection:bg-[#0D0BCC] selection:text-white [&>input]:text-[#18191B]"
                    />
                  </div>

                  {currentQuestion?.type === "text" ? (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        {currentQuestion?.answers?.map((answer, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              value={answer.text}
                              onChange={(e) => handleAnswerChange(index, e.target.value)}
                              placeholder={`Вариант ответа ${index + 1}`}
                              className="w-full text-[#18191B] placeholder:text-[#71717A] [&>input]:text-[#18191B] selection:bg-[#0D0BCC] selection:text-white border-0 shadow-none"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveAnswer(index)}
                              disabled={currentQuestion.answers.length <= 1}
                              className="h-[18px] w-[18px] p-0 border-0 shadow-none"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <div className="flex items-center gap-2">
                          <Input
                            readOnly
                            placeholder="Добавить вариант"
                            className="w-full text-[#A2ACB0] border-0 shadow-none cursor-pointer"
                            onClick={handleAddAnswer}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="invisible"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
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
                                  className="w-full text-[#18191B] placeholder:text-[#71717A] [&>input]:text-[#18191B] selection:bg-[#0D0BCC] selection:text-white border-0 shadow-none"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveAnswer(index)}
                                  disabled={currentQuestion.answers.length <= 1}
                                  className="h-[18px] w-[18px] p-0 border-0 shadow-none"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <div className="flex items-center gap-2">
                              <RadioGroupItem
                                value="add"
                                className="opacity-0"
                              />
                              <Input
                                readOnly
                                placeholder="Добавить вариант"
                                className="w-full text-[#A2ACB0] border-0 shadow-none cursor-pointer"
                                onClick={handleAddAnswer}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="invisible"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
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
                                  className="w-full text-[#18191B] placeholder:text-[#71717A] [&>input]:text-[#18191B] selection:bg-[#0D0BCC] selection:text-white border-0 shadow-none"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveAnswer(index)}
                                  disabled={currentQuestion.answers.length <= 1}
                                  className="h-[18px] w-[18px] p-0 border-0 shadow-none"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <div className="flex items-center gap-2">
                              <Checkbox
                                className="opacity-0"
                              />
                              <Input
                                readOnly
                                placeholder="Добавить вариант"
                                className="w-full text-[#A2ACB0] placeholder:text-[#A2ACB0] [&>input]:text-[#A2ACB0] selection:bg-[#0D0BCC] selection:text-white"
                                onClick={handleAddAnswer}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="invisible"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between">
                  <div className="transition-opacity duration-300">
                    {isSaving ? (
                      <span className="flex items-center gap-2 text-[#707579] font-inter text-[14px]">
                      <Loader2 className="h-4 w-4 animate-spin" />Изменения сохраняются
                    </span>
                    ) : (
                      <span className="flex items-center gap-2 text-[#77CD81] font-inter text-[14px]">
                      <Check className="h-4 w-4" />Изменения сохранены {saveTime}
                    </span>
                    )}
                  </div>

                  {questions.length > 1 && <Trash2 onClick={() => handleDelete(currentQuestion?.id)} />}
                </div>
              </div>

              <div className="flex-1 p-6 rounded-lg">
                {/* Preview section with Telegram mockup */}
                <div className="relative w-[319px] h-[600px]">
                  {/* Background image - Telegram mockup */}
                  <img
                    src="/preview.png"
                    alt="Telegram mockup"
                    className="absolute inset-0 w-full h-full object-contain"
                  />

                  {/* Question content overlay - adjusted position */}
                  <div
                    className="absolute top-[125px] left-[38px] w-[243px] h-[500px] overflow-y-auto px-4"
                  >
                    {/* Question title - centered with new styling */}
                    <h3 className="text-[16px] font-inter font-semibold text-[#0D0BCC] mb-3 text-center">
                      {currentQuestion?.title || "Ваш вопрос здесь"}
                    </h3>

                    {/* Question image - below title */}
                    {currentQuestion?.media_path && (
                      <img
                        src={currentQuestion.media_path}
                        alt="Question"
                        className="w-full h-auto mb-4 rounded-md object-cover"
                        style={{ maxHeight: "150px" }}
                      />
                    )}

                    {/* Question description */}
                    {currentQuestion?.description && (
                      <p className="text-[13px] text-[#707579] mb-4 leading-tight text-center">
                        {currentQuestion.description}
                      </p>
                    )}

                    {/* Answers list */}
                    <div className="space-y-3">
                      {currentQuestion?.type === "single_choice" ? (
                        <RadioGroup>
                          {currentQuestion?.answers.map((answer, index) => (
                            <label
                              key={index}
                              className={`flex items-center p-3 rounded-md border-2 ${
                                answer.is_correct
                                  ? "border-[#77CD81] bg-[#F0F9F1]"
                                  : "border-[#A2ACB0] hover:bg-[#F5F5F5]"
                              } cursor-pointer`}
                            >
                              <RadioGroupItem
                                value={index.toString()}
                                checked={answer.is_correct}
                                className="mr-3"
                              />
                              <span className={`text-[15px] font-manrope ${
                                answer.is_correct ? "text-[#77CD81]" : "text-[#000000]"
                              }`}>
                                {answer.text}
                              </span>
                            </label>
                          ))}
                        </RadioGroup>
                      ) : currentQuestion?.type === "multiple_choice" ? (
                        <>
                          {currentQuestion?.answers.map((answer, index) => (
                            <label
                              key={index}
                              className={`flex items-center p-3 rounded-md border-2 ${
                                answer.is_correct
                                  ? "border-[#77CD81] bg-[#F0F9F1]"
                                  : "border-[#A2ACB0] hover:bg-[#F5F5F5]"
                              } cursor-pointer`}
                            >
                              <Checkbox
                                checked={answer.is_correct}
                                className="mr-3"
                              />
                              <span className={`text-[15px] font-manrope ${
                                answer.is_correct ? "text-[#77CD81]" : "text-[#000000]"
                              }`}>
                                  {answer.text}
                                </span>
                            </label>
                          ))}
                        </>
                      ) : (
                        /* Text answer type - replaced with input */
                        <div className="mt-4">
                          <div className="relative">
                            <input
                              type="text"
                              disabled
                              placeholder="Введите ваш ответ..."
                              className="w-full p-3 text-[15px] font-manrope border-2 border-[#A2ACB0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D0BCC] focus:border-transparent"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreateQuiz;
