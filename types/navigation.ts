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
  Games: undefined;
  ReadingMaterials: undefined;
  ProfessorExercises: undefined;
  ProfessorVideos: undefined;
  AddExercise: undefined;
  EditExercise: { exerciseId: string };
  Hint: { hint: string };
  Settings: undefined;
  AddVideo: undefined;
  EditVideo: { videoId: string };
  AlunoVideos: undefined; // Adicionando a nova rota
};

// Tipos das rotas do Drawer Navigator do Aluno
export type AlunoDrawerParamList = {
  AlunoHome: undefined;
  ExerciseList: undefined;
  Profile: undefined;
  Settings: undefined;
  Games: undefined;
  Videos: undefined; // Mantido, mas podemos renomear para AlunoVideos
  ReadingMaterials: undefined;
  AlunoVideos: undefined; // Adicionando para o aluno
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
