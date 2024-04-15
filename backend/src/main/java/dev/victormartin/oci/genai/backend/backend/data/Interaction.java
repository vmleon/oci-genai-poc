package dev.victormartin.oci.genai.backend.backend.data;

import jakarta.persistence.*;

import java.util.Date;
import java.util.Objects;

@Entity
public class Interaction {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    Long id;

    String conversationId;

    @Temporal(TemporalType.DATE)
    Date datetimeRequest;

    @Lob
    @Column
    String request;

    @Temporal(TemporalType.DATE)
    Date datetimeResponse;

    @Lob
    @Column
    String response;

    @Lob
    @Column
    String errorMessage;

    public Interaction() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getConversationId() {
        return conversationId;
    }

    public void setConversationId(String conversationId) {
        this.conversationId = conversationId;
    }

    public Date getDatetimeRequest() {
        return datetimeRequest;
    }

    public void setDatetimeRequest(Date datetimeRequest) {
        this.datetimeRequest = datetimeRequest;
    }

    public String getRequest() {
        return request;
    }

    public void setRequest(String request) {
        this.request = request;
    }

    public Date getDatetimeResponse() {
        return datetimeResponse;
    }

    public void setDatetimeResponse(Date datetimeResponse) {
        this.datetimeResponse = datetimeResponse;
    }

    public String getResponse() {
        return response;
    }

    public void setResponse(String response) {
        this.response = response;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Interaction that = (Interaction) o;
        return id.equals(that.id) && conversationId.equals(that.conversationId) && Objects.equals(datetimeRequest, that.datetimeRequest) && Objects.equals(request, that.request) && Objects.equals(datetimeResponse, that.datetimeResponse) && Objects.equals(response, that.response) && Objects.equals(errorMessage, that.errorMessage);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, conversationId, datetimeRequest, request, datetimeResponse, response, errorMessage);
    }
}
