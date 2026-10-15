/**
 * Affiche le contenu Markdown d'un article.
 * react-markdown ne laisse PAS passer de HTML brut : un contenu piégé
 * (<script>…) est affiché comme du texte, pas exécuté. C'est plus sûr.
 */
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Markdown({ content }: { content: string }) {
  return (
    <div className="prose-article">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
