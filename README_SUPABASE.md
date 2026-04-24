# Vitalis OS - Setup do Backend (Supabase)

Este aplicativo utiliza Supabase para autenticação e banco de dados. Para que o registro de novos usuários funcione corretamente, você precisa configurar o banco de dados.

## Instruções de Setup

1. Acesse o [Dashboard do Supabase](https://app.supabase.com/).
2. Selecione o seu projeto.
3. No menu lateral, vá em **SQL Editor**.
4. Clique em **New query**.
5. Copie o conteúdo do arquivo `SUPABASE_SETUP.sql` (disponível no projeto) e cole no editor.
6. Clique em **Run**.

## Erros Comuns

### "Database error saving new user"
Este erro geralmente ocorre se:
- A tabela `profiles` não existe.
- O Trigger `on_auth_user_created` está tentando inserir dados em colunas que não existem.
- Você está tentando registrar um e-mail ou CPF que já existe (e há uma restrição UNIQUE).

### "Supabase not configured"
Verifique se as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão configuradas nos **Secrets** do AI Studio.
