# Guia 00: setup

Todo mundo do time precisa estar com `make check` verde antes de começar. Se
algo falhar, procurem a mensagem na seção de erros no fim; cada uma tem o
conserto. Não gastem mais de 1h nisso sozinhos: travou, chamem monitor.

## O que instalar

São 4 ferramentas. Python não está na lista porque o `uv` cuida dele.

| Ferramenta | Para quê | Como instalar |
|---|---|---|
| git | versionar em equipe | já vem no macOS/Linux; Windows: dentro do WSL (abaixo) |
| uv | Python + dependências do backend | https://docs.astral.sh/uv/getting-started/installation/ |
| node 22+ | rodar o frontend | de preferência via nvm: https://github.com/nvm-sh/nvm |
| make | os comandos `make check`, `make test`... | macOS: `xcode-select --install` · Ubuntu/WSL: `sudo apt install make` |

## macOS / Linux

```bash
# 1. uv
curl -LsSf https://astral.sh/uv/install.sh | sh
# feche e reabra o terminal, depois:
uv --version
# → uv 0.9.x

# 2. node via nvm (instale o nvm pelo link acima primeiro)
nvm install 22 && nvm use 22
node --version
# → v22.x.x
```

## Windows: usem WSL2

O projeto todo (make, uvicorn, caminhos de arquivo) assume um terminal Linux.
No Windows nativo não há suporte. Usem WSL2:

```powershell
# PowerShell como administrador:
wsl --install
# reinicie o PC quando pedir; na primeira abertura do Ubuntu, crie usuário/senha
```

Daqui em diante, tudo acontece dentro do terminal Ubuntu (procurem "Ubuntu"
no menu iniciar). Sigam a seção "macOS / Linux" acima e rodem também
`sudo apt update && sudo apt install make git`.

No VS Code, instalem a extensão WSL e abram o projeto com `code .` de dentro
do Ubuntu. Assim editor, terminal e arquivos ficam no mesmo lugar. Clonem o
repo dentro do WSL (em `~/`), nunca em `/mnt/c/...`: é lento e dá problema de
permissão.

## Clonar e validar

```bash
# aceite o link do GitHub Classroom (cria o repo do seu time), depois:
git clone <url-do-repo-do-seu-time>
cd <nome-do-repo>

# backend
cd backend && uv sync && cd ..
# → Resolved N packages ... (uv baixa o Python 3.12 sozinho se precisar)

# frontend
cd frontend && npm install && cp .env.local.example .env.local && cd ..

# valida o ambiente:
make check
```

Saída esperada:

```
check_setup — validando o ambiente

  ✓ python 3.12
  ✓ uv instalado
  ✓ node v22.x.x
  ✓ backend responde: GET /usuarios → 200
  ✓ core/ conectado: GET /usuarios/stats → 200

tudo verde — próximos passos: make seed, make dev-back, make dev-front
```

Com tudo verde, sigam para a seção "Como começar" do README.

## Erros comuns de instalação

**`✗ python 3.9 (precisa de 3.11+)`** ou qualquer versão antiga
A causa costuma ser o Python da Anaconda ou do sistema na frente no PATH. Não
precisa mexer no PATH: o projeto roda tudo via `uv run`, que usa o Python
fixado em `backend/.python-version`. Rodem:
```bash
cd backend && uv python install 3.12 && uv sync
make check
```
Se ainda acusar versão velha, vocês rodaram `python scripts/...` direto. Usem
sempre `uv run python scripts/...` (o Makefile já faz isso).

**`✗ node v16.x (precisa de 20+)`**
```bash
nvm install 22 && nvm use 22 && nvm alias default 22
```
Sem nvm: desinstalem o node antigo e instalem o atual em https://nodejs.org.

**`command not found: make`**
macOS: `xcode-select --install`. Ubuntu/WSL: `sudo apt install make`.
Windows fora do WSL: voltem para a seção Windows.

**`command not found: uv` logo depois de instalar**
O instalador alterou o perfil do shell. Fechem e reabram o terminal.

**`npm install` falha com erro de permissão ou de versão**
Confiram `node --version` (20+) e se estão na pasta `frontend/`. No WSL,
confiram que o repo está em `~/...` e não em `/mnt/c/...`.
