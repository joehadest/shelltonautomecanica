import type { ConfiguracaoEmpresa } from "@/lib/types";
import { maskCnpj } from "@/lib/masks";
import {
  type DocumentoDraft,
  type DocumentoItem,
  DOCUMENTO_TIPO_LABEL,
  calcularTotais,
  formatCurrency,
  formatPhoneDisplay,
  itemSubtotal,
} from "@/lib/documentos";
import styles from "./documentos.module.css";

function ItemTable({
  title,
  items,
  subtotal,
}: {
  title: string;
  items: DocumentoItem[];
  subtotal: number;
}) {
  const valid = items.filter((item) => item.descricao.trim());
  return (
    <section className={styles.paperSection}>
      <h3>{title}</h3>
      <div
        className={styles.tableScroll}
        tabIndex={0}
        role="region"
        aria-label={`Tabela de ${title.toLowerCase()}`}
      >
        <table>
          <caption className={styles.srOnly}>{title}</caption>
          <thead>
            <tr>
              <th scope="col">Descrição</th>
              <th scope="col">Qtd.</th>
              <th scope="col">Unitário</th>
              <th scope="col">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {valid.length ? (
              valid.map((item) => (
                <tr key={item.id}>
                  <td>{item.descricao}</td>
                  <td>{item.quantidade}</td>
                  <td>{formatCurrency(item.valorUnitario)}</td>
                  <td>{formatCurrency(itemSubtotal(item))}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4}>Nenhum item informado.</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}>Subtotal</td>
              <td>{formatCurrency(subtotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

export function DocumentoPreview({
  draft,
  empresa,
}: {
  draft: DocumentoDraft;
  empresa: ConfiguracaoEmpresa;
}) {
  const totals = calcularTotais(draft);
  return (
    <article className={styles.paper} aria-label="Prévia do documento">
      <header className={styles.paperHeader}>
        <div className={styles.paperBrand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={empresa.logo_base64 || "/shellton-logo.png"}
            alt="Logo da oficina"
          />
          <div>
            <strong>{empresa.nome_fantasia.toUpperCase()}</strong>
            <p>{empresa.razao_social}</p>
            <p>
              CNPJ: {maskCnpj(empresa.cnpj)}
              {empresa.inscricao_estadual &&
                ` · IE: ${empresa.inscricao_estadual}`}
            </p>
            <p>
              {[empresa.endereco, empresa.cidade_uf]
                .filter(Boolean)
                .join(" — ")}
            </p>
            <p>
              {[
                empresa.telefone ? formatPhoneDisplay(empresa.telefone) : "",
                empresa.email,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>
        <h2 className={styles.paperTitle}>
          {DOCUMENTO_TIPO_LABEL[draft.tipo]}
        </h2>
        <p className={styles.paperNotice}>
          Documento informativo — sem valor fiscal
        </p>
      </header>

      <div className={styles.paperClient}>
        <p>
          <span>Cliente:</span>{" "}
          <strong>{draft.clienteNome.trim() || "—"}</strong>
        </p>
        {draft.cpfCnpj.trim() && (
          <p>
            <span>CPF/CNPJ:</span> {draft.cpfCnpj}
          </p>
        )}
        {draft.telefone.trim() && (
          <p>
            <span>WhatsApp:</span> {formatPhoneDisplay(draft.telefone)}
          </p>
        )}
        {(draft.modelo.trim() || draft.placa.trim()) && (
          <p>
            <span>Veículo:</span>{" "}
            {[draft.modelo.trim(), draft.placa.trim().toUpperCase()]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </div>

      <ItemTable
        title="Mão de obra"
        items={draft.maoDeObra}
        subtotal={totals.subtotalMaoDeObra}
      />
      <ItemTable
        title="Produtos / peças"
        items={draft.produtos}
        subtotal={totals.subtotalProdutos}
      />
      <div className={styles.paperTotals}>
        <div>
          <span>Subtotal geral</span>
          <span>{formatCurrency(totals.subtotal)}</span>
        </div>
        {totals.desconto > 0 && (
          <div>
            <span>Desconto</span>
            <span>− {formatCurrency(totals.desconto)}</span>
          </div>
        )}
        <div className={styles.paperGrandTotal}>
          <span>Total</span>
          <span>{formatCurrency(totals.total)}</span>
        </div>
      </div>
      {draft.observacoes.trim() && (
        <section className={styles.paperSection}>
          <h3>Observações</h3>
          <p className={styles.paperObservations}>{draft.observacoes}</p>
        </section>
      )}

      <section className={styles.paperSection}>
        <h3>Assinaturas</h3>
        <div className={styles.signatures}>
          <div className={styles.signature}>
            <div className={styles.signatureSpace}>Assinatura do cliente</div>
            <p>{draft.clienteNome.trim() || "Cliente"}</p>
            <small>Cliente</small>
          </div>
          <div className={styles.signature}>
            <div className={styles.signatureSpace}>
              {empresa.assinatura_base64 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={empresa.assinatura_base64}
                  alt="Assinatura da empresa"
                />
              ) : (
                "Assinatura da oficina"
              )}
            </div>
            <p>{empresa.nome_fantasia}</p>
            <small>{empresa.assinatura_responsavel}</small>
          </div>
        </div>
      </section>
      <p className={styles.paperFooter}>
        Documento informativo. Não substitui nota fiscal.
      </p>
    </article>
  );
}
