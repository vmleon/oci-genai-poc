package dev.victormartin.oci.genai.backend.backend;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.WebSocketClient;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import java.lang.reflect.Type;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.fail;


@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class PromptIntegrationTests {

	@LocalServerPort
	private int port;

	private WebSocketStompClient stompClient;

	private final WebSocketHttpHeaders headers = new WebSocketHttpHeaders();

	@BeforeEach
	public void setup() {
		WebSocketClient webSocketClient = new StandardWebSocketClient();
		this.stompClient = new WebSocketStompClient(webSocketClient);
		this.stompClient.setMessageConverter(new MappingJackson2MessageConverter());
	}

	@Test
	public void getAnswer() throws Exception {

		final CountDownLatch latch = new CountDownLatch(1);
		final AtomicReference<Throwable> failure = new AtomicReference<>();

		StompSessionHandler handler = new TestSessionHandler(failure) {

			@Override
			public void afterConnected(final StompSession session, StompHeaders connectedHeaders) {
				session.subscribe("/user/queue/answer", new StompFrameHandler() {
					@Override
					public Type getPayloadType(StompHeaders headers) {
						return Answer.class;
					}

					@Override
					public void handleFrame(StompHeaders headers, Object payload) {
						Answer answer = (Answer) payload;
						try {
							assertEquals("Spring", answer.getContent());
						} catch (Throwable t) {
							failure.set(t);
						} finally {
							session.disconnect();
							latch.countDown();
						}
					}
				});
				try {
					session.send("/genai/prompt", new Prompt("Spring"));
				} catch (Throwable t) {
					failure.set(t);
					latch.countDown();
				}
			}
		};

		this.stompClient.connectAsync("ws://localhost:{port}/websocket", this.headers, handler, this.port);

		if (latch.await(3, TimeUnit.SECONDS)) {
			if (failure.get() != null) {
				throw new AssertionError("", failure.get());
			}
		}
		else {
			fail("Answer not received");
		}

	}

	private static class TestSessionHandler extends StompSessionHandlerAdapter {

		private final AtomicReference<Throwable> failure;

		public TestSessionHandler(AtomicReference<Throwable> failure) {
			this.failure = failure;
		}

		@Override
		public void handleFrame(StompHeaders headers, Object payload) {
			this.failure.set(new Exception(headers.toString()));
		}

		@Override
		public void handleException(StompSession s, StompCommand c, StompHeaders h, byte[] p, Throwable ex) {
			this.failure.set(ex);
		}

		@Override
		public void handleTransportError(StompSession session, Throwable ex) {
			this.failure.set(ex);
		}
	}
}