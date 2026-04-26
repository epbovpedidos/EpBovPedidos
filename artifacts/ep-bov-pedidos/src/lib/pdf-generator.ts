import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, formatDate } from "./format";
import { Order, Customer } from "@workspace/api-client-react";

function getStoredLogo(): string | null {
  try {
    return localStorage.getItem("epbov_logo");
  } catch {
    return null;
  }
}

function detectImageFormat(dataUrl: string): "PNG" | "JPEG" | "WEBP" {
  const m = dataUrl.match(/^data:image\/(\w+)/);
  const fmt = m?.[1]?.toLowerCase();
  if (fmt === "jpeg" || fmt === "jpg") return "JPEG";
  if (fmt === "webp") return "WEBP";
  return "PNG";
}

export function generateOrderPDF(order: Order, comprador?: Customer, vendedor?: Customer) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  const logo = getStoredLogo();
  let headerTextX = 14;
  if (logo) {
    try {
      const fmt = detectImageFormat(logo);
      doc.addImage(logo, fmt, 14, 10, 22, 22);
      headerTextX = 40;
    } catch {
      headerTextX = 14;
    }
  }

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("EP COMERCIO DE BOVINOS", headerTextX, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("CNPJ: 63.078.738/0001-91", headerTextX, 24);
  doc.text("Telefone: (66) 99631-9292", headerTextX, 29);
  doc.text("Endereço: Al. Das Rosas, 2500, Vila Aurora – Rondonópolis-MT", headerTextX, 34);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`PEDIDO N° ${order.numero}`, pageWidth - 14, 18, { align: "right" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Data de Emissão: ${formatDate(order.dataEmissao)}`, pageWidth - 14, 24, { align: "right" });

  doc.line(14, 40, pageWidth - 14, 40);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Cronograma", 14, 48);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Data de Embarque: ${formatDate(order.dataEmbarque)}`, 14, 54);
  doc.text(`Data de Desembarque: ${formatDate(order.dataDesembarque)}`, pageWidth / 2, 54);
  doc.text(`Data do Abate: ${formatDate(order.dataAbate)}`, 14, 60);

  doc.line(14, 64, pageWidth - 14, 64);

  const colWidth = (pageWidth - 28) / 2;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Comprador", 14, 72);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Nome: ${comprador?.nome || "-"}`, 14, 78);
  doc.text(`Fazenda: ${comprador?.fazenda || "-"}`, 14, 83);
  doc.text(`CPF/CNPJ: ${comprador?.cpfCnpj || "-"}`, 14, 88);
  doc.text(`Inscrição: ${comprador?.inscricao || "-"}`, 14, 93);
  doc.text(`Endereço: ${comprador?.endereco || "-"}`, 14, 98);
  doc.text(`Município/UF: ${comprador?.municipio || "-"}/${comprador?.uf || "-"}`, 14, 103);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Vendedor", 14 + colWidth, 72);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Nome: ${vendedor?.nome || "-"}`, 14 + colWidth, 78);
  doc.text(`Fazenda: ${vendedor?.fazenda || "-"}`, 14 + colWidth, 83);
  doc.text(`CPF/CNPJ: ${vendedor?.cpfCnpj || "-"}`, 14 + colWidth, 88);
  doc.text(`Inscrição: ${vendedor?.inscricao || "-"}`, 14 + colWidth, 93);
  doc.text(`Endereço: ${vendedor?.endereco || "-"}`, 14 + colWidth, 98);
  doc.text(`Município/UF: ${vendedor?.municipio || "-"}/${vendedor?.uf || "-"}`, 14 + colWidth, 103);

  let currentY = 110;

  if (order.roteiro) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Roteiro:", 14, currentY);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const splitRoteiro = doc.splitTextToSize(order.roteiro, pageWidth - 28);
    doc.text(splitRoteiro, 14, currentY + 6);
    currentY += 6 + (splitRoteiro.length * 5) + 4;
  }

  const tableData = order.items.map(item => [
    item.especie,
    item.raca,
    item.idade,
    item.quantidade.toString(),
    item.peso.toString(),
    formatCurrency(item.precoArroba),
    formatCurrency(item.total)
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Espécie', 'Raça', 'Idade', 'Qtd', 'Peso (@)', 'Preço/@', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [46, 125, 50] },
    foot: [['', '', 'Total', order.totalAnimais.toString(), order.totalPeso.toString(), '', formatCurrency(order.totalValor)]],
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Condições de Pagamento", 14, currentY);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Forma de Pagamento: ${order.formaPagamento}`, 14, currentY + 6);
  if (order.formaPagamento === "A PRAZO" && order.prazoPagamento) {
    doc.text(`Prazo: ${order.prazoPagamento}`, 14, currentY + 11);
  }

  if (vendedor?.banco || vendedor?.conta) {
    currentY += 20;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Dados Bancários (Vendedor)", 14, currentY);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Banco: ${vendedor.banco || "-"}`, 14, currentY + 6);
    doc.text(`Agência: ${vendedor.agencia || "-"}`, 14, currentY + 11);
    doc.text(`Conta: ${vendedor.conta || "-"}`, 14 + colWidth, currentY + 6);
    doc.text(`Titular: ${vendedor.titular || "-"}`, 14 + colWidth, currentY + 11);
  }

  currentY += 20;

  if (order.observacao) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Observações", 14, currentY);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const splitObs = doc.splitTextToSize(order.observacao, pageWidth - 28);
    doc.text(splitObs, 14, currentY + 6);
    currentY += 6 + (splitObs.length * 5) + 10;
  } else {
    currentY += 10;
  }

  // Assinaturas — espaço em branco acima da linha para preenchimento manual,
  // apenas papel/função abaixo da linha.
  if (currentY > 240) {
    doc.addPage();
    currentY = 30;
  } else {
    currentY += 30;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  if (order.assinaturaComprador) {
    doc.text(order.assinaturaComprador, pageWidth / 4, currentY - 2, { align: "center" });
  }
  if (order.assinaturaVendedor) {
    doc.text(order.assinaturaVendedor, (pageWidth / 4) * 3, currentY - 2, { align: "center" });
  }

  doc.line(20, currentY, (pageWidth / 2) - 10, currentY);
  doc.line((pageWidth / 2) + 10, currentY, pageWidth - 20, currentY);

  doc.text("Comprador", pageWidth / 4, currentY + 6, { align: "center" });
  doc.text("Vendedor", (pageWidth / 4) * 3, currentY + 6, { align: "center" });

  const fileName = `${order.numero}_${comprador?.nome?.toUpperCase().replace(/\s+/g, '') || 'PEDIDO'}.pdf`;

  return {
    blob: doc.output('bloburl').toString(),
    fileName,
    pdfBlob: doc.output('blob') as Blob,
  };
}

export async function shareOrderPDFViaWhatsApp(
  order: Order,
  comprador?: Customer,
  vendedor?: Customer
): Promise<"shared" | "downloaded-fallback"> {
  const { pdfBlob, fileName } = generateOrderPDF(order, comprador, vendedor);
  const file = new File([pdfBlob], fileName, { type: "application/pdf" });

  const text =
    `*PEDIDO DE COMPRA DE BOVINOS - EP BOV*\n` +
    `Pedido N°: ${order.numero}\n` +
    `Comprador: ${comprador?.nome || "-"}\n` +
    `Vendedor: ${vendedor?.nome || "-"}\n` +
    `Total Animais: ${order.totalAnimais}\n` +
    `Valor Total: ${formatCurrency(order.totalValor)}\n\n` +
    `Segue em anexo o PDF do pedido.`;

  const nav = navigator as Navigator & {
    canShare?: (data: { files?: File[] }) => boolean;
    share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void>;
  };

  if (nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
    try {
      await nav.share({
        files: [file],
        title: `Pedido ${order.numero}`,
        text,
      });
      return "shared";
    } catch (e: any) {
      if (e?.name === "AbortError") {
        return "shared";
      }
    }
  }

  // Fallback: baixar o PDF e abrir o WhatsApp Web com a mensagem,
  // para que o usuário anexe o arquivo manualmente.
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);

  const waText = encodeURIComponent(`${text}\n\n(Anexe o arquivo ${fileName} que foi baixado.)`);
  window.open(`https://wa.me/?text=${waText}`, "_blank");
  return "downloaded-fallback";
}
