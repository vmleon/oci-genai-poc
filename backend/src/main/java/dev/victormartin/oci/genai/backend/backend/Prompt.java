package dev.victormartin.oci.genai.backend.backend;

public class Prompt {

	private String content;

	public Prompt() {
	}

	public Prompt(String content) {
		this.content = content;
	}

	public String getContent() {
		return content;
	}

	public void setContent(String content) {
		this.content = content;
	}
}
