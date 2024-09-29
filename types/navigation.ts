// types/navigation.ts

// Tipos das rotas do Stack Navigator
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  PasswordReset: undefined;
  AlunoDrawer: undefined;
  ProfessorDrawer: undefined;
  ExerciseDetail: { exerciseId: string };
  // Adicione outras telas conforme necessário
};

// Tipos das rotas do Drawer Navigator do Aluno
export type AlunoDrawerParamList = {
  AlunoHome: undefined;
  ExerciseList: undefined;
  Profile: undefined;
  // Adicione outras telas específicas para o aluno
};

// Tipos das rotas do Drawer Navigator do Professor
export type ProfessorDrawerParamList = {
  ProfessorHome: undefined;
  AddExercise: undefined;
  Profile: undefined;
  // Adicione outras telas específicas para o professor
};
