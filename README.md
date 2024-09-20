# Estatístico+

Bem-vindo ao **Estatístico+**, um aplicativo educativo para o ensino de estatística no ensino médio.

## Sumário

- Descrição
- Funcionalidades
- Tecnologias Utilizadas
- Pré-requisitos
- Instalação
- Execução
- Compilação para Produção
- Contribuição
- Licença

## Descrição

O Estatístico+ é um aplicativo móvel desenvolvido em React Native com TypeScript, projetado para tornar o aprendizado de estatística mais interativo e envolvente. Inspirado no estilo gamificado do Duolingo, o aplicativo oferece:

- Atividades práticas e simulações
- Exercícios interativos com feedback instantâneo
- Sistema de pontuação e recompensas
- Possibilidade de professores adicionarem exercícios personalizados
- Salvamento de progresso do aluno

## Funcionalidades

- **Cadastro e Login de Usuários:** Registro e autenticação de usuários utilizando o Firebase Authentication.
- **Gamificação:** Sistema de níveis, pontuação e conquistas para motivar os alunos.
- **Conteúdo Interativo:** Módulos que permitem manipulação de dados, visualização de gráficos e realização de experimentos.
- **Acessibilidade:** Compatível com dispositivos Android e iOS.
- **Personalização para Professores:** Professores podem adicionar e personalizar exercícios de acordo com as necessidades da turma.

## Tecnologias Utilizadas

- **React Native** com **TypeScript**
- **Firebase** (Authentication e Firestore)
- **Expo**
- **React Navigation**

## Pré-requisitos

- **Node.js** (versão LTS recomendada)
- **Git** (para clonar o repositório)
- **Expo CLI** (via npx)
- **Conta no Firebase** (para obter as credenciais)

## Instalação

**1. Clone o Repositório**

```bash
git clone https://github.com/lfazzion/EstatisticoMais.git
```

**2. Navegue até o Diretório do Projeto**

```bash
cd EstatisticoMais
```

**3. Instale as Dependências**

```bash
npm install
```

## Execução

**1. Iniciar o Servidor de Desenvolvimento**

```bash
npx expo start
```

**2. Executar no Dispositivo Físico ou Emulador**

- **Dispositivo Físico:**
  - Instale o aplicativo Expo Go na App Store ou Google Play Store.
  - Escaneie o QR Code exibido no Expo Developer Tools.
- **Emulador Android:**
  - Certifique-se de ter o Android Studio e um AVD configurado.
- **Simulador iOS:**
  - Disponível apenas no macOS com Xcode instalado.

## Compilação para Produção

Para gerar os arquivos de instalação (APK para Android ou IPA para iOS), você precisará configurar o Expo Application Services (EAS).

**1. Instalar o EAS CLI**

```bash
npm install -g eas-cli
```

**2. Login no EAS**

```bash
eas login
```

**3. Configurar o Projeto**

```bash
eas build:configure
```

**4. Construir o Aplicativo**

- **Android:**

```bash
eas build -p android --profile production
```

- **iOS:**

```bash
eas build -p ios --profile production
```

**Nota:** Para iOS, você precisará de uma conta de desenvolvedor Apple.

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## Licença

Este projeto está sob a licença MIT.
