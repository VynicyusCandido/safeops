package br.com.safeops.repository;

import br.com.safeops.entity.Ocorrencia;
import br.com.safeops.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface OcorrenciaRepository extends JpaRepository<Ocorrencia, UUID> {
    List<Ocorrencia> findBySolicitante(Usuario solicitante);
}
