package dev.victormartin.oci.genai.backend.backend;

import com.oracle.bmc.model.BmcException;
import dev.victormartin.oci.genai.backend.backend.data.Interaction;
import dev.victormartin.oci.genai.backend.backend.data.InteractionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;
import org.springframework.web.util.HtmlUtils;

import java.util.Date;

@Controller
public class PromptController {
	Logger logger = LoggerFactory.getLogger(PromptController.class);

	@Autowired
	private final InteractionRepository interactionRepository;

	@Autowired
	OCIGenAIService genAI;

	public PromptController(InteractionRepository interactionRepository, OCIGenAIService genAI) {
		this.interactionRepository = interactionRepository;
		this.genAI = genAI;
	}

	@MessageMapping("/prompt")
	@SendToUser("/queue/answer")
	public Answer handlePrompt(Prompt prompt) {
		String promptEscaped = HtmlUtils.htmlEscape(prompt.getContent());
		logger.info("Prompt " + promptEscaped + " received");
		Interaction interaction = new Interaction();
		interaction.setConversationId(prompt.getConversationId());
		interaction.setDatetimeRequest(new Date());
		interaction.setRequest(promptEscaped);
		Interaction saved = interactionRepository.save(interaction);
		try {
			String responseFromGenAI = genAI.request(promptEscaped);
			saved.setDatetimeResponse(new Date());
			saved.setResponse(responseFromGenAI);
			interactionRepository.save(saved);
			return new Answer(responseFromGenAI, "");
		} catch (BmcException exception) {
			String unmodifiedMessage = exception.getUnmodifiedMessage();
			int statusCode = exception.getStatusCode();
			String errorMessage = statusCode + " " + unmodifiedMessage;
			logger.error(errorMessage);
			saved.setErrorMessage(errorMessage);
			interactionRepository.save(saved);
			return new Answer("", errorMessage);
		}
	}

}
