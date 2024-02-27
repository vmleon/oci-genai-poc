package dev.victormartin.oci.genai.backend.backend;

import com.oracle.bmc.ClientConfiguration;
import com.oracle.bmc.ConfigFileReader;
import com.oracle.bmc.Region;
import com.oracle.bmc.auth.AuthenticationDetailsProvider;
import com.oracle.bmc.auth.ConfigFileAuthenticationDetailsProvider;
import com.oracle.bmc.generativeaiinference.GenerativeAiInferenceClient;
import com.oracle.bmc.retrier.RetryConfiguration;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.io.IOException;

@Configuration
public class GenerativeAiInferenceClientConfig {

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

    private Region region;

    @PostConstruct
    private void postConstruct() {
        System.out.println("regionCode: " + regionCode);
        region = Region.fromRegionCode(regionCode);
    }

    @Bean
    @Profile("production")
    GenerativeAiInferenceClient instancePrincipalConfig() throws IOException {
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
        GenerativeAiInferenceClient generativeAiInferenceClient = new GenerativeAiInferenceClient(provider,
                clientConfiguration);
        generativeAiInferenceClient.setEndpoint(ENDPOINT);
        generativeAiInferenceClient.setRegion(region);
        return generativeAiInferenceClient;
    }
    @Bean
    @Profile("default")
    GenerativeAiInferenceClient localConfig() throws IOException {
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
        GenerativeAiInferenceClient generativeAiInferenceClient = new GenerativeAiInferenceClient(provider,
                clientConfiguration);
        generativeAiInferenceClient.setEndpoint(ENDPOINT);
        generativeAiInferenceClient.setRegion(region);
        return generativeAiInferenceClient;
    }
}
