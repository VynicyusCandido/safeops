package br.com.safeops.repository;

import br.com.safeops.entity.Comentario;
import br.com.safeops.entity.Ocorrencia;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ComentarioRepository extends JpaRepository<Comentario, UUID> {
    List<Comentario> findByOcorrencia(Ocorrencia ocorrencia);
}
