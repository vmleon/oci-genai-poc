package dev.victormartin.oci.genai.backend.backend;

import com.oracle.bmc.ClientConfiguration;
import com.oracle.bmc.ConfigFileReader;
import com.oracle.bmc.Region;
import com.oracle.bmc.auth.AuthenticationDetailsProvider;
import com.oracle.bmc.auth.ConfigFileAuthenticationDetailsProvider;
import com.oracle.bmc.generativeaiinference.GenerativeAiInferenceClient;
import com.oracle.bmc.generativeaiinference.model.*;
import com.oracle.bmc.generativeaiinference.requests.GenerateTextRequest;
import com.oracle.bmc.generativeaiinference.responses.GenerateTextResponse;
import com.oracle.bmc.retrier.RetryConfiguration;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.stream.Collectors;

@Service
public class GenAI {
    @Value("${genai.endpoint}")
    private String ENDPOINT;
    @Value("${genai.region}")
    private String regionCode;
    @Value("${genai.config.location}")
    private String CONFIG_LOCATION;
    @Value("${genai.config.profile}")
    private String CONFIG_PROFILE;
    @Value("${genai.compartment_id}")
    private String COMPARTMENT_ID;

    @Value("${genai.model_id}")
    private String modelId;
    private GenerativeAiInferenceClient generativeAiInferenceClient;

    public GenAI() throws IOException {
    }

    @PostConstruct
    private void postConstruct() throws IOException {
        Region region = Region.fromRegionCode(regionCode);
        // Configuring the AuthenticationDetailsProvider. It's assuming there is a default OCI config file
        // "~/.oci/config", and a profile in that config with the name defined in CONFIG_PROFILE variable.
        final ConfigFileReader.ConfigFile configFile =  ConfigFileReader.parse(CONFIG_LOCATION, CONFIG_PROFILE);
        final AuthenticationDetailsProvider provider = new ConfigFileAuthenticationDetailsProvider(configFile);

        // Set up Generative AI client with credentials and endpoint
        ClientConfiguration clientConfiguration =
                ClientConfiguration.builder()
                        .readTimeoutMillis(240000)
                        .retryConfiguration(RetryConfiguration.NO_RETRY_CONFIGURATION)
                        .build();
        generativeAiInferenceClient = new GenerativeAiInferenceClient(provider, clientConfiguration);
        generativeAiInferenceClient.setEndpoint(ENDPOINT);
        generativeAiInferenceClient.setRegion(region);

        System.out.println("Model ID: " + modelId);
    }

    public String request(String input) {
        // Build generate text request, send, and get response
        CohereLlmInferenceRequest llmInferenceRequest =
                CohereLlmInferenceRequest.builder()
                        .prompt(input)
                        .maxTokens(600)
                        .temperature((double)1)
                        .frequencyPenalty((double)0)
                        .topP((double)0.75)
                        .isStream(false)
                        .isEcho(false)
                        .build();

        GenerateTextDetails generateTextDetails = GenerateTextDetails.builder()
                .servingMode(OnDemandServingMode.builder().modelId(modelId).build())
                .compartmentId(COMPARTMENT_ID)
                .inferenceRequest(llmInferenceRequest)
                .build();
        GenerateTextRequest generateTextRequest = GenerateTextRequest.builder()
                .generateTextDetails(generateTextDetails)
                .build();
        GenerateTextResponse generateTextResponse = generativeAiInferenceClient.generateText(generateTextRequest);
        CohereLlmInferenceResponse response =
                (CohereLlmInferenceResponse) generateTextResponse.getGenerateTextResult().getInferenceResponse();
        String responseTexts = response.getGeneratedTexts().stream().map(t -> t.getText()).collect(Collectors.joining(","));
        return responseTexts;
    }
}
