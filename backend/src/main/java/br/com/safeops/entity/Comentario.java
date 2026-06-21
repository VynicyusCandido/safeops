package br.com.safeops.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "comentario")
public class Comentario {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "ocorrencia_id", updatable = false)
    private Ocorrencia ocorrencia;

    @ManyToOne(optional = false)
    @JoinColumn(name = "autor_id", updatable = false)
    private Usuario autor;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String conteudo;

    @Column(name = "criado_em", updatable = false)
    private Instant criadoEm;

    @PrePersist
    void prePersist() { criadoEm = Instant.now(); }

    public UUID getId() { return id; }
    public Ocorrencia getOcorrencia() { return ocorrencia; }
    public void setOcorrencia(Ocorrencia ocorrencia) { this.ocorrencia = ocorrencia; }
    public Usuario getAutor() { return autor; }
    public void setAutor(Usuario autor) { this.autor = autor; }
    public String getConteudo() { return conteudo; }
    public void setConteudo(String conteudo) { this.conteudo = conteudo; }
    public Instant getCriadoEm() { return criadoEm; }
}
