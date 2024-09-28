# Estatístico+

Bem-vindo ao **Estatístico+**, um aplicativo educativo para o ensino de estatística no ensino médio.

## Sumário

- Descrição
- Funcionalidades
- Tecnologias Utilizadas
- Pré-requisitos
- Instalação
- Execução <!-- - Compilação para Produção -->
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

**Executar em Dispositivo Físico ou Emulador**

- **Dispositivo Físico:**

  - Instale o aplicativo Expo Go no smartphone:
    - Android: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent&hl=pt_BR&pli=1)
    - iOS: [App Store](https://apps.apple.com/br/app/expo-go/id982107779)
  - Com o terminal aberto na **pasta do projeto**, execute o comando:
    ```bash
    npx expo start
    ```
  - Com o smartphone, escaneie o QR Code exibido no terminal.

- **Emulador Android:**
  - **Pré-requisitos:**
    - [Android Studio](https://developer.android.com/studio?hl=pt-br) instalado e um dispositivo configurado.
  - Abra o diretório do projeto no Android Studio
  - Inicialize o dispositivo emulado em **Device Manager**.
  - No terminal do Android Studio, execute o comando:
    ```bash
    npx expo start
    ```
  - Pressione `a` para abrir o aplicativo no dispositivo emulado.
- **Simulador iOS:**
  - **Pré-requisito:**
    - MacOS com [Xcode](https://apps.apple.com/br/app/xcode/id497799835?mt=12) instalado.
  - Com o terminal aberto no diretório do Projeto, execute:
    ```bash
    npx expo start
    ```
  - Pressione `i` para abrir o aplicativo no iPhone simulado.

<!--## Compilação para Produção

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

**Nota:** Para iOS, você precisará de uma conta de desenvolvedor Apple.-->

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## Licença

Este projeto está sob a licença MIT.

## Observações Adicionais

- Mantenha as dependências do projeto atualizadas para garantir compatibilidade e segurança.
- Consulte as documentações do React Native e do Firebase para mais informações.
<!-- - Para dúvidas ou suporte, entre em contato pelo email: lowellfazzion@gmail.com-->

## Agradecimentos

Agradecemos a todos que contribuíram para o desenvolvimento deste projeto.
