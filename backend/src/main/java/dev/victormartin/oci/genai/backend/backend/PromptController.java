package dev.victormartin.oci.genai.backend.backend;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;
import org.springframework.web.util.HtmlUtils;

@Controller
public class PromptController {
	Logger logger = LoggerFactory.getLogger(PromptController.class);

	@Autowired
	OCIGenAIService genAI;

	@MessageMapping("/prompt")
	@SendToUser("/queue/answer")
	public Answer handlePrompt(Prompt prompt) throws Exception {
		String promptEscaped = HtmlUtils.htmlEscape(prompt.getContent());
		logger.info("Prompt " + promptEscaped + " received");
		String responseFromGenAI = genAI.request(promptEscaped);
		return new Answer(responseFromGenAI);
	}

}
