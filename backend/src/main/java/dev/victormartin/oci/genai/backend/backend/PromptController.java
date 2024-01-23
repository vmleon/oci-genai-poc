package dev.victormartin.oci.genai.backend.backend;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;
import org.springframework.web.util.HtmlUtils;

import java.security.Principal;

@Controller
public class PromptController {
	Logger logger = LoggerFactory.getLogger(PromptController.class);

	@MessageMapping("/prompt")
	@SendToUser("/queue/answer")
	public Answer handlePrompt(Prompt prompt) throws Exception {
		logger.info("Prompt " + prompt.getContent() + " received");
		int randomSleepInMillis = (int) ((Math.random() * (1500 - 500)) + 500);
		Thread.sleep(randomSleepInMillis);
		String response = HtmlUtils.htmlEscape(prompt.getContent());
		Answer answer = new Answer(response);
		return answer;
	}

}
