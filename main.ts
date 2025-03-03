import OpenAI from "jsr:@openai/openai";

class OpenAIClient {
	private openai = new OpenAI();
	private assistantId = "";
	private threadId = "";

	async createAssistant() {
		try {
			const assistant = await this.openai.beta.assistants.create({
				name: "Reflective Diary Companion",
				instructions: `
				You are a thoughtful and empathetic journal companion.
				Listen to the user’s experiences, emotions, and reflections.
				Respond in a way that encourages deeper reflection and understanding.
				When summarizing, structure it in a diary format with a meaningful title.
				`,
				model: "gpt-4o",
			});
			this.assistantId = assistant.id;
		} catch (error) {
			console.error("Error creating assistant:", error);
		}
	}

	async createThread() {
		try {
			const thread = await this.openai.beta.threads.create();
			this.threadId = thread.id;
		} catch (error) {
			console.error("Error creating thread:", error);
		}
	}

	private async createAndPollRun(content: string): Promise<string> {
		if (!this.threadId || !this.assistantId) {
			console.error("Thread or Assistant not initialized.");
			return "";
		}

		try {
			await this.openai.beta.threads.messages.create(this.threadId, {
				role: "user",
				content,
			});

			const run = await this.openai.beta.threads.runs.createAndPoll(
				this.threadId,
				{ assistant_id: this.assistantId },
			);

			if (run.status === "completed") {
				return await this.getLatestAssistantMessage();
			}
			console.error(`Run failed with status: ${run.status}`);
			return "";
		} catch (error) {
			console.error("Error during conversation run:", error);
			return "";
		}
	}

	private async getLatestAssistantMessage(): Promise<string> {
		try {
			const messages = await this.openai.beta.threads.messages.list(
				this.threadId,
			);
			const latestMessage = messages.data.find(
				(msg) => msg.role === "assistant",
			);

			return latestMessage && "text" in latestMessage.content[0]
				? latestMessage.content[0].text.value
				: "[No response]";
		} catch (error) {
			console.error("Error fetching latest assistant message:", error);
			return "[Error retrieving response]";
		}
	}

	// Send the user's message and display the response
	async sendMessage(message: string) {
		const response = await this.createAndPollRun(message);
		if (response) console.log(`assistant > ${response}`);
	}

	// Retrieve a summary of the conversation in Markdown diary format
	async summarize(): Promise<string> {
		const prompt = `
		Summarize the conversation as a diary entry in Markdown format.
		Generate a suitable title based on the conversation.
		Write the entry in a personal and reflective style.
		
		Format:
		
		# <Diary Title>
		
		## Today's Reflection
		<Summary of events and emotions discussed in the conversation>
		`;

		return await this.createAndPollRun(prompt);
	}
}

// Get user input
async function getUserMessage(): Promise<string> {
	await Deno.stdout.write(new TextEncoder().encode("> "));
	const buf = new Uint8Array(1024);
	const n = (await Deno.stdin.read(buf)) ?? 0;
	return new TextDecoder().decode(buf.subarray(0, n)).trim();
}

// Get the date in YYYY-MM-DD format
function getDateString(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

// Create a directory
async function ensureDiaryDirectory() {
	const diaryDir = "./diary";
	try {
		await Deno.mkdir(diaryDir, { recursive: true });
	} catch (error) {
		if (!(error instanceof Deno.errors.AlreadyExists)) {
			console.error("Error creating diary directory:", error);
		}
	}
}

async function chatLoop(client: OpenAIClient) {
	await ensureDiaryDirectory();
	const summaryFilePath = `./diary/${getDateString()}_summary.md`;

	console.log(
		"Starting a conversation with your journal companion. Type 'exit' to finish.",
	);

	while (true) {
		const message = await getUserMessage();
		if (message.toLowerCase() === "exit") {
			const summary = await client.summarize();
			console.log(`summary: \n${summary}`);

			try {
				await Deno.writeTextFile(summaryFilePath, summary);
				console.log(`Saved diary at ${summaryFilePath}`);
			} catch (error) {
				console.error("Error saving diary file:", error);
			}

			break;
		}
		await client.sendMessage(message);
	}
}

async function main() {
	const client = new OpenAIClient();
	await client.createAssistant();
	await client.createThread();
	await chatLoop(client);
}

main();
