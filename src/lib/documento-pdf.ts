import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ConfiguracaoEmpresa } from "./types";
import {
  type DocumentoDraft,
  type DocumentoItem,
  DOCUMENTO_TIPO_LABEL,
  buildWhatsAppShortMessage,
  calcularTotais,
  formatCurrency,
  formatPhoneDisplay,
  itemSubtotal,
} from "./documentos";

const BRAND = { r: 225, g: 29, b: 42 };

function tableFinalY(doc: jsPDF): number {
  const meta = (
    doc as jsPDF & { lastAutoTable?: { finalY: number } }
  ).lastAutoTable;
  return meta?.finalY ?? 40;
}

function imageFormat(dataUrl: string): "PNG" | "JPEG" {
  if (/image\/jpe?g/i.test(dataUrl)) return "JPEG";
  return "PNG";
}

function renderEmpresaHeader(
  doc: jsPDF,
  empresa: ConfiguracaoEmpresa,
  draft: DocumentoDraft,
  margin: number,
  pageWidth: number
): number {
  const headerH = 40;
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
  doc.rect(0, 0, pageWidth, headerH, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(empresa.nome_fantasia.toUpperCase(), margin, 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  const infoLines: string[] = [
    empresa.razao_social,
    `CNPJ: ${empresa.cnpj}${
      empresa.inscricao_estadual.trim()
        ? `  ·  IE: ${empresa.inscricao_estadual}`
        : ""
    }`,
    [empresa.endereco, empresa.cidade_uf].filter(Boolean).join(" — "),
    [empresa.telefone, empresa.email].filter(Boolean).join("  ·  "),
  ].filter(Boolean);

  let ly = 16;
  for (const line of infoLines) {
    if (line.trim()) {
      doc.text(line, margin, ly);
      ly += 4.5;
    }
  }

  const titulo = DOCUMENTO_TIPO_LABEL[draft.tipo].toUpperCase();
  const emissao = new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(titulo, pageWidth - margin, 10, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Documento informativo — sem valor fiscal", pageWidth - margin, 16, {
    align: "right",
  });
  doc.text(`Emissão: ${emissao}`, pageWidth - margin, 22, { align: "right" });

  return headerH + 6;
}

function renderAssinaturas(
  doc: jsPDF,
  y: number,
  margin: number,
  pageWidth: number,
  pageHeight: number,
  empresa: ConfiguracaoEmpresa,
  clienteNome: string
): void {
  const boxH = 24;
  const needed = boxH + 28;
  if (y + needed > pageHeight - 16) {
    doc.addPage();
    y = margin;
  } else {
    y += 8;
  }

  const colW = (pageWidth - margin * 2 - 8) / 2;
  const leftX = margin;
  const rightX = margin + colW + 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(35, 35, 35);
  doc.text("ASSINATURAS", margin, y);
  y += 5;

  doc.setDrawColor(190, 190, 190);
  doc.setLineWidth(0.3);

  // Cliente — área em branco
  doc.rect(leftX, y, colW, boxH, "S");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 140);
  doc.text("Espaço para assinatura do cliente", leftX + colW / 2, y + boxH / 2, {
    align: "center",
  });
  doc.setDrawColor(120, 120, 120);
  doc.line(leftX + 8, y + boxH - 6, leftX + colW - 8, y + boxH - 6);
  doc.setFontSize(7.5);
  doc.setTextColor(35, 35, 35);
  doc.text(
    clienteNome.trim() || "Cliente",
    leftX + colW / 2,
    y + boxH + 5,
    { align: "center" }
  );
  doc.setFontSize(6.5);
  doc.setTextColor(120, 120, 120);
  doc.text("Assinatura do cliente", leftX + colW / 2, y + boxH + 9, {
    align: "center",
  });

  // Empresa — assinatura carregada
  doc.setDrawColor(190, 190, 190);
  doc.rect(rightX, y, colW, boxH, "S");
  if (empresa.assinatura_base64) {
    try {
      const fmt = imageFormat(empresa.assinatura_base64);
      doc.addImage(
        empresa.assinatura_base64,
        fmt,
        rightX + 6,
        y + 2,
        colW - 12,
        boxH - 8
      );
    } catch {
      doc.setFontSize(7);
      doc.setTextColor(180, 80, 80);
      doc.text("Erro ao carregar assinatura", rightX + colW / 2, y + boxH / 2, {
        align: "center",
      });
    }
  }
  doc.setDrawColor(120, 120, 120);
  doc.line(rightX + 8, y + boxH - 6, rightX + colW - 8, y + boxH - 6);
  doc.setFontSize(7.5);
  doc.setTextColor(35, 35, 35);
  doc.text(empresa.nome_fantasia, rightX + colW / 2, y + boxH + 5, {
    align: "center",
  });
  if (empresa.assinatura_responsavel.trim()) {
    doc.setFontSize(6.5);
    doc.setTextColor(120, 120, 120);
    doc.text(empresa.assinatura_responsavel, rightX + colW / 2, y + boxH + 9, {
      align: "center",
    });
  }
}

export function buildDocumentoFilename(draft: DocumentoDraft): string {
  const tipo = draft.tipo === "orcamento" ? "orcamento" : "recibo";
  const nome =
    draft.clienteNome
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase()
      .slice(0, 30) || "cliente";
  const date = new Date().toISOString().slice(0, 10);
  return `shellton-${tipo}-${nome}-${date}.pdf`;
}

function renderItemTable(
  doc: jsPDF,
  y: number,
  margin: number,
  titulo: string,
  itens: DocumentoItem[]
): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(35, 35, 35);
  doc.text(titulo, margin, y);
  y += 4;

  const validos = itens.filter((i) => i.descricao.trim());

  autoTable(doc, {
    startY: y,
    head: [["Descrição", "Qtd.", "Valor unit. (R$)", "Subtotal (R$)"]],
    body:
      validos.length > 0
        ? validos.map((item) => [
            item.descricao.trim(),
            String(Math.max(0, item.quantidade)),
            formatCurrency(Math.max(0, item.valorUnitario)),
            formatCurrency(itemSubtotal(item)),
          ])
        : [["(nenhum item informado)", "", "", ""]],
    theme: "grid",
    headStyles: {
      fillColor: [BRAND.r, BRAND.g, BRAND.b],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 9,
      halign: "center",
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [35, 35, 35],
      valign: "middle",
    },
    columnStyles: {
      0: { cellWidth: "auto", halign: "left" },
      1: { halign: "center", cellWidth: 16 },
      2: { halign: "right", cellWidth: 34 },
      3: { halign: "right", cellWidth: 34 },
    },
    alternateRowStyles: { fillColor: [252, 252, 252] },
    margin: { left: margin, right: margin },
  });

  return tableFinalY(doc) + 6;
}

export function buildDocumentoPdf(
  draft: DocumentoDraft,
  empresa: ConfiguracaoEmpresa
): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const { subtotalMaoDeObra, subtotalProdutos, subtotal, desconto, total } =
    calcularTotais(draft);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  let y = renderEmpresaHeader(doc, empresa, draft, margin, pageWidth);
  doc.setTextColor(35, 35, 35);

  // Bloco do cliente
  doc.setFillColor(248, 248, 248);
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 30, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("DADOS DO CLIENTE", margin + 4, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Nome: ${draft.clienteNome.trim() || "—"}`, margin + 4, y + 14);
  doc.text(
    `WhatsApp: ${formatPhoneDisplay(draft.telefone)}`,
    margin + 4,
    y + 21
  );
  const veiculo = [draft.modelo.trim(), draft.placa.trim().toUpperCase()]
    .filter(Boolean)
    .join(" · ");
  if (veiculo) {
    doc.text(`Veículo: ${veiculo}`, margin + 95, y + 14);
  }

  y += 36;

  y = renderItemTable(doc, y, margin, "MÃO DE OBRA", draft.maoDeObra);
  y = renderItemTable(doc, y, margin, "PRODUTOS / PEÇAS", draft.produtos);

  const summaryWidth = 78;
  const summaryX = pageWidth - margin - summaryWidth;

  autoTable(doc, {
    startY: y,
    body: [
      ["Mão de obra", formatCurrency(subtotalMaoDeObra)],
      ["Produtos / peças", formatCurrency(subtotalProdutos)],
      ["Subtotal", formatCurrency(subtotal)],
      ...(desconto > 0 ? [["Desconto", `− ${formatCurrency(desconto)}`]] : []),
      ["TOTAL", formatCurrency(total)],
    ],
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 38 },
      1: { halign: "right", cellWidth: 40 },
    },
    margin: { left: summaryX, right: margin },
    didParseCell: (data) => {
      const totalRow = desconto > 0 ? 4 : 3;
      if (data.section === "body" && data.row.index === totalRow) {
        data.cell.styles.fillColor = [BRAND.r, BRAND.g, BRAND.b];
        data.cell.styles.textColor = 255;
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fontSize = 10;
      }
    },
  });

  y = tableFinalY(doc) + 8;

  if (draft.observacoes.trim()) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(35, 35, 35);
    doc.text("OBSERVAÇÕES", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(70, 70, 70);
    const lines = doc.splitTextToSize(
      draft.observacoes.trim(),
      pageWidth - margin * 2
    );
    doc.text(lines, margin, y);
    y += lines.length * 4.2 + 4;
  }

  renderAssinaturas(
    doc,
    y,
    margin,
    pageWidth,
    pageHeight,
    empresa,
    draft.clienteNome
  );

  doc.setFontSize(7.5);
  doc.setTextColor(130, 130, 130);
  doc.text(
    `${empresa.nome_fantasia} — Documento informativo. Não substitui nota fiscal.`,
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );

  return doc;
}

export function downloadDocumentoPdf(
  draft: DocumentoDraft,
  empresa: ConfiguracaoEmpresa
): void {
  buildDocumentoPdf(draft, empresa).save(buildDocumentoFilename(draft));
}

export function documentoPdfBlob(
  draft: DocumentoDraft,
  empresa: ConfiguracaoEmpresa
): Blob {
  return buildDocumentoPdf(draft, empresa).output("blob");
}

export async function shareDocumentoPdf(
  draft: DocumentoDraft,
  empresa: ConfiguracaoEmpresa
): Promise<"shared" | "downloaded"> {
  const filename = buildDocumentoFilename(draft);
  const blob = documentoPdfBlob(draft, empresa);
  const file = new File([blob], filename, { type: "application/pdf" });

  if (typeof navigator !== "undefined" && navigator.share) {
    const payload = {
      files: [file],
      title: DOCUMENTO_TIPO_LABEL[draft.tipo],
      text: buildWhatsAppShortMessage(draft),
    };
    if (navigator.canShare?.(payload)) {
      await navigator.share(payload);
      return "shared";
    }
  }

  downloadDocumentoPdf(draft, empresa);
  return "downloaded";
}
