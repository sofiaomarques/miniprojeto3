// Package handlers reúne os handlers HTTP da aplicação.
package handlers

import (
	"io"
	"log"
	"net/http"
)

// respostaSaude é o corpo fixo devolvido pelo health check.
const respostaSaude = `{"status":"ok"}`

// Health informa que o servidor está no ar. Não depende de banco nem de configuração.
func Health(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	// Em HEAD o próprio net/http descarta o corpo.
	if _, err := io.WriteString(w, respostaSaude); err != nil {
		// A resposta já começou a ser enviada; só resta registrar a falha.
		log.Printf("Erro ao escrever resposta do health check: %v", err)
	}
}
