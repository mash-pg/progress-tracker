# Vercel と Supabase の使用方法

このドキュメントでは、進捗管理アプリをVercelにデプロイし、Supabaseをバックエンドとして利用するための基本的な設定と手順を説明します。

## 1. Supabase のセットアップ

Supabaseは、PostgreSQLデータベース、認証、ストレージなどを提供するオープンソースのFirebase代替サービスです。

### 1.1. プロジェクトの作成

1.  **Supabaseアカウントの作成またはログイン:**
    *   [Supabaseのウェブサイト](https://supabase.com/) にアクセスし、GitHubアカウントなどでサインアップまたはログインします。
2.  **新しいプロジェクトの作成:**
    *   ダッシュボードで「New project」をクリックします。
    *   **Name:** プロジェクトの名前を入力します (例: `progress-tracker-app`)
    *   **Organization:** 組織を選択または新規作成します。
    *   **Database Password:** 強力なパスワードを設定し、安全な場所に保管してください。これはデータベースへのアクセスに必要になります。
    *   **Region:** アプリケーションのユーザーに近いリージョンを選択します。
    *   「Create new project」をクリックします。

### 1.2. データベースのセットアップ

プロジェクトが作成されると、ダッシュボードにリダイレクトされます。

1.  **テーブルの作成:**
    *   左サイドバーの「Table editor」アイコンをクリックします。
    *   「New table」をクリックします。
    *   **`tasks` テーブルの作成:**
        *   **Name:** `tasks`
        *   **Enable Row Level Security (RLS):** **無効にする** (今回は簡易化のため。本番環境では有効にしてポリシーを設定することを強く推奨します)
        *   **Columns:**
            *   `id`: `uuid` (Primary Key, Default Value: `gen_random_uuid()`) - UUIDを自動生成
            *   `name`: `text`
            *   `description`: `text` (Nullable)
            *   `status`: `text` (Default Value: `todo`) - `todo`, `in-progress`, `completed` のいずれかを想定
            *   `createdAt`: `timestamp with time zone` (Default Value: `now()`) - 作成日時を自動設定
            *   `dueDate`: `date`
            *   `categoryId`: `uuid` (Nullable) - `categories` テーブルへの外部キーとして使用
            *   `completed`: `boolean` (Default Value: `false`) - タスクの完了状態
        *   「Save」をクリックします。
    *   **`categories` テーブルの作成:**
        *   **Name:** `categories`
        *   **Enable Row Level Security (RLS):** **無効にする**
        *   **Columns:**
            *   `id`: `uuid` (Primary Key, Default Value: `gen_random_uuid()`) - UUIDを自動生成
            *   `name`: `text`
        *   「Save」をクリックします。

2.  **外部キー制約の設定 (Optionalだが推奨):**
    *   `tasks` テーブルの `categoryId` カラムを `categories` テーブルの `id` カラムにリンクします。
    *   「Table editor」で `tasks` テーブルを選択し、「Columns」タブで `categoryId` をクリックします。
    *   「Edit column」ダイアログで、「Foreign Key」セクションを展開し、`categories` テーブルの `id` を選択します。
    *   「Save」をクリックします。

### 1.3. APIキーの取得

1.  左サイドバーの「Project Settings」アイコン（歯車マーク）をクリックします。
2.  「API」を選択します。
3.  以下の情報を控えておきます。
    *   **Project URL:** (例: `https://abcdefg.supabase.co`)
    *   **`anon` (public) key:** (例: `eyJ...`)

## 2. Next.jsアプリケーションの設定

SupabaseのAPIキーをNext.jsアプリケーションに設定します。

1.  プロジェクトのルートディレクトリに `.env.local` ファイルを作成します（もし存在しない場合）。
2.  `.env.local` ファイルに、Supabaseから取得したURLとAnonキーを以下の形式で追加します。

    ```dotenv
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```
    *   `YOUR_SUPABASE_PROJECT_URL` と `YOUR_SUPABASE_ANON_KEY` を、Supabaseダッシュボードで控えた実際の値に置き換えてください。

3.  `src/lib/supabase.ts` ファイルが正しく環境変数を読み込んでいることを確認します。

    ```typescript
    // src/lib/supabase.ts
    import { createClient } from '@supabase/supabase-js';

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase URL or Anon Key');
    }

    export const supabase = createClient(supabaseUrl, supabaseAnonKey);
    ```

## 3. Vercelへのデプロイ

VercelはNext.jsアプリケーションのデプロイに最適化されています。

### 3.1. Gitリポジトリの準備

1.  プロジェクトのコードがGitHub, GitLab, またはBitbucketのリポジトリにプッシュされていることを確認します。

### 3.2. Vercelへのインポート

1.  **Vercelアカウントの作成またはログイン:**
    *   [Vercelのウェブサイト](https://vercel.com/) にアクセスし、Gitプロバイダーアカウントなどでサインアップまたはログインします。
2.  **新しいプロジェクトのインポート:**
    *   ダッシュボードで「Add New...」→「Project」をクリックします。
    *   Gitリポジトリをインポートするオプションを選択し、該当するリポジトリを検索して選択します。
3.  **プロジェクトの設定:**
    *   **Root Directory:** Next.jsプロジェクトのルートディレクトリが正しく設定されていることを確認します。通常はリポジトリのルートです。
    *   **Environment Variables:**
        *   「Environment Variables」セクションを展開します。
        *   SupabaseのAPIキーをここに追加します。`.env.local`と同じキー名と値を使用します。
            *   `NEXT_PUBLIC_SUPABASE_URL`
            *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
        *   これらの環境変数は、ビルド時およびランタイム時にVercelによってアプリケーションに注入されます。
    *   「Deploy」をクリックします。

### 3.3. デプロイの確認

デプロイが完了すると、VercelはアプリケーションのURLを提供します。そのURLにアクセスして、アプリケーションが正しく動作していることを確認してください。

## 4. 補足

*   **Row Level Security (RLS):** 本番環境では、SupabaseのRLSを有効にし、適切なポリシーを設定してデータベースへのアクセスを制御することを強く推奨します。これにより、不正なデータアクセスを防ぐことができます。
*   **環境変数:** 開発環境と本番環境で異なるSupabaseプロジェクトを使用する場合、Vercelの環境変数設定で本番用のキーを設定し、ローカル開発では `.env.local` を使用します。
*   **データベースの初期データ:** Supabaseに初期データを投入するには、SQLエディタを使用するか、Supabase CLIなどのツールを利用できます。

これで、進捗管理アプリがSupabaseをバックエンドとしてVercelにデプロイされる準備が整いました。