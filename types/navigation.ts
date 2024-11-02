// types/navigation.ts

// Tipos das rotas do Stack Navigator
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  PasswordReset: undefined;
  AlunoDrawer: undefined;
  ProfessorDrawer: undefined;
  Profile: undefined;
  ExerciseDetail: { exerciseId: string };
  ReadingMaterials: undefined;
  ProfessorExercises: undefined;
  ProfessorVideos: undefined;
  AddExercise: undefined;
  EditExercise: { exerciseId: string };
  Hint: { hint: string };
  Settings: undefined;
  AddVideo: undefined;
  EditVideo: { videoId: string };
  AlunoVideos: undefined;
  Games: undefined;
  FormulaGame: undefined;
  QuizGame: undefined;
};

// Tipos das rotas do Drawer Navigator do Aluno
export type AlunoDrawerParamList = {
  AlunoHome: undefined;
  ExerciseList: undefined;
  Profile: undefined;
  Settings: undefined;
  Videos: undefined;
  ReadingMaterials: undefined;
  AlunoVideos: undefined;
  Games: undefined;
  FormulaGame: undefined;
  QuizGame: undefined;
};

// Tipos das rotas do Drawer Navigator do Professor
export type ProfessorDrawerParamList = {
  ProfessorHome: undefined;
  ProfessorExercises: undefined;
  AddExercise: undefined;
  AddVideo: undefined;
  ProfessorVideos: undefined;
  ReadingMaterials: undefined;
  Profile: undefined;
  Settings: undefined;
};
