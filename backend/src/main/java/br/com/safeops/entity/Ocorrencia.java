package br.com.safeops.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ocorrencia")
public class Ocorrencia {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusOcorrencia status = StatusOcorrencia.ABERTA;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Prioridade prioridade;

    @ManyToOne(optional = false)
    @JoinColumn(name = "solicitante_id", updatable = false)
    private Usuario solicitante;

    @ManyToOne
    @JoinColumn(name = "analista_id")
    private Usuario analista;

    @Column(name = "criado_em", updatable = false)
    private Instant criadoEm;

    @Column(name = "atualizado_em")
    private Instant atualizadoEm;

    @Column(name = "encerrado_em")
    private Instant encerradoEm;

    @PrePersist
    void prePersist() { criadoEm = atualizadoEm = Instant.now(); }

    @PreUpdate
    void preUpdate() { atualizadoEm = Instant.now(); }

    public UUID getId() { return id; }
    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public StatusOcorrencia getStatus() { return status; }
    public void setStatus(StatusOcorrencia status) { this.status = status; }
    public Prioridade getPrioridade() { return prioridade; }
    public void setPrioridade(Prioridade prioridade) { this.prioridade = prioridade; }
    public Usuario getSolicitante() { return solicitante; }
    public void setSolicitante(Usuario solicitante) { this.solicitante = solicitante; }
    public Usuario getAnalista() { return analista; }
    public void setAnalista(Usuario analista) { this.analista = analista; }
    public Instant getCriadoEm() { return criadoEm; }
    public Instant getAtualizadoEm() { return atualizadoEm; }
    public Instant getEncerradoEm() { return encerradoEm; }
    public void setEncerradoEm(Instant encerradoEm) { this.encerradoEm = encerradoEm; }
}
