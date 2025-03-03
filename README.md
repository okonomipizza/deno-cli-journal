# Diary Companion

This is a tool that utilizes Deno and the OpenAI API to have conversations with an AI on the CLI and automatically summarize them into a Markdown-formatted diary.

## Install
Clone this repository
```
git clone https://github.com/okonomipizza/deno-cli-journal.git
cd deno-cli-journal
```
## Set Up OpenAI API Key
`export OPENAI_API_KEY="your-api-key-here"`

## Usage
`deno -A main.ts`

## Chatting with the Assistant
- Type your daily reflections and press `Enter`.
- The AI will respond with meaningful questions and insights.
- To exit, type:
  `exit`
  This will generate and save a Markdown diary entry automatically.
