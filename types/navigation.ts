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
  Videos: undefined;
  ReadingMaterials: undefined;
  ProfessorExercises: undefined;
  AddExercise: undefined;
  EditExercise: { exerciseId: string };
  Hint: { hint: string };
  Settings: undefined;
};

// Tipos das rotas do Drawer Navigator do Aluno
export type AlunoDrawerParamList = {
  AlunoHome: undefined;
  ExerciseList: undefined;
  Profile: undefined;
  Settings: undefined;
  Games: undefined;
  Videos: undefined;
  ReadingMaterials: undefined;
};

// Tipos das rotas do Drawer Navigator do Professor
export type ProfessorDrawerParamList = {
  ProfessorHome: undefined;
  ProfessorExercises: undefined;
  Profile: undefined;
  Settings: undefined;
};
