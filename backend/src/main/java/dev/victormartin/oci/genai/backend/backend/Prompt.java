package dev.victormartin.oci.genai.backend.backend;

public class Prompt {

	private String conversationId;

	private String content;

	public Prompt() {
	}

	public Prompt(String conversationId,String content) {
		this.conversationId = conversationId;
		this.content = content;
	}

	public String getContent() {
		return content;
	}

	public void setContent(String content) {
		this.content = content;
	}

	public String getConversationId() {
		return conversationId;
	}

	public void setConversationId(String conversationId) {
		this.conversationId = conversationId;
	}
}
