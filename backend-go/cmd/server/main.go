package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"redeservicos/internal/handlers"
)

// portaPadrao é usada quando a variável PORT não está definida.
const portaPadrao = "8080"

// tempoEncerramento é o prazo para terminar as requisições em andamento.
// Deve ser menor que o tempo que a plataforma espera antes de forçar o fim (SIGKILL).
const tempoEncerramento = 20 * time.Second

func main() {
	porta, err := lerPorta()
	if err != nil {
		log.Fatalf("Configuração inválida: %v", err)
	}
	endereco := ":" + porta

	// Roteador principal; as rotas serão registradas nos próximos blocos.
	roteador := http.NewServeMux()

	// GET também atende HEAD; outros métodos recebem 405 automaticamente.
	roteador.HandleFunc("GET /health", handlers.Health)

	// Timeouts protegem contra conexões lentas ou ociosas.
	servidor := &http.Server{
		Addr:              endereco,
		Handler:           roteador,
		ReadHeaderTimeout: 5 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	// Graceful shutdown: em vez de morrer na hora ao receber SIGTERM (enviado
	// pelo Render a cada deploy) ou SIGINT (Ctrl+C), o servidor para de aceitar
	// conexões novas, termina as requisições em andamento e só então sai.
	contextoSinal, pararSinais := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer pararSinais()

	// O servidor roda em uma goroutine para o main ficar livre e esperar o sinal.
	erroServidor := make(chan error, 1)
	go func() {
		log.Printf("Iniciando servidor na porta %s...", porta)
		erroServidor <- servidor.ListenAndServe()
	}()

	// Espera o que acontecer primeiro: falha ao subir ou pedido de encerramento.
	select {
	case err := <-erroServidor:
		log.Fatalf("Erro ao executar o servidor: %v", err)
	case <-contextoSinal.Done():
		log.Println("Sinal de encerramento recebido, finalizando requisições em andamento...")
	}

	// Um segundo sinal (ex.: Ctrl+C de novo) volta a encerrar imediatamente.
	pararSinais()

	// Shutdown fecha o listener e espera as requisições ativas, até o prazo.
	contextoEncerramento, cancelar := context.WithTimeout(context.Background(), tempoEncerramento)
	defer cancelar()

	if err := servidor.Shutdown(contextoEncerramento); err != nil {
		log.Fatalf("Erro ao encerrar o servidor: %v", err)
	}
	log.Println("Servidor encerrado com sucesso.")
}

// lerPorta retorna a porta definida em PORT ou a porta padrão.
// Retorna erro se PORT não for um número entre 1 e 65535.
func lerPorta() (string, error) {
	porta := os.Getenv("PORT")
	if porta == "" {
		return portaPadrao, nil
	}

	numero, err := strconv.Atoi(porta)
	if err != nil || numero < 1 || numero > 65535 {
		return "", fmt.Errorf("PORT=%q inválida: use um número inteiro entre 1 e 65535", porta)
	}

	return strconv.Itoa(numero), nil
}
