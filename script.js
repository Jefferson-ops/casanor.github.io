// Constantes
const STORAGE_KEY = 'estoqueCasaNor';
const HISTORY_STORAGE_KEY = 'estoqueCasaNorHistory';
const THEME_STORAGE_KEY = 'estoqueCasaNorTheme';
const form = document.getElementById('product-form');
const tableBody = document.getElementById('table-body');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search');
const toast = document.getElementById('toast');
const cancelBtn = document.getElementById('btn-cancel');
const historyModal = document.getElementById('history-modal');
const historyList = document.getElementById('history-list');
const filterType = document.getElementById('filter-type');
const filterDate = document.getElementById('filter-date');
const clearFiltersBtn = document.getElementById('clear-filters');
const historyBtn = document.getElementById('btn-history');
const closeModal = document.querySelector('.close-modal');

// Estado da aplicação
let produtos = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let editIndex = -1;
let historico = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY)) || [];

// Função para alternar entre temas
function initTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = themeToggle.querySelector('i');
  
  // Verifica o tema salvo ou usa a preferência do sistema
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 
                    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  
  // Aplica o tema salvo ou a preferência do sistema
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(themeIcon, savedTheme);
  
  // Alterna o tema ao clicar no botão
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    updateThemeIcon(themeIcon, newTheme);
  });
}

// Atualiza o ícone do tema
function updateThemeIcon(iconElement, theme) {
  if (theme === 'dark') {
    iconElement.classList.remove('fa-moon');
    iconElement.classList.add('fa-sun');
  } else {
    iconElement.classList.remove('fa-sun');
    iconElement.classList.add('fa-moon');
  }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  // Inicializa o tema
  initTheme();
  
  // Atualiza o ano no rodapé
  document.getElementById('current-year').textContent = new Date().getFullYear();
  
  // Carrega os produtos
  renderProdutos();
  
  // Configura os eventos
  setupEventListeners();
});

// Configura os eventos
function setupEventListeners() {
  // Envio do formulário
  form.addEventListener('submit', handleSubmit);
  
  // Botão de cancelar edição
  cancelBtn.addEventListener('click', cancelEdit);
  
  // Busca em tempo real
  searchInput.addEventListener('input', () => {
    renderProdutos(searchInput.value.toLowerCase());
  });
  
  // Previne o envio do formulário ao pressionar Enter em campos de texto
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'submit') {
      e.preventDefault();
    }
  });

  // Eventos do histórico
  historyBtn.addEventListener('click', openHistoryModal);
  closeModal.addEventListener('click', closeHistoryModal);
  filterType.addEventListener('change', renderHistory);
  filterDate.addEventListener('change', renderHistory);
  
  // Fechar modal ao clicar fora do conteúdo
  window.addEventListener('click', (e) => {
    if (e.target === historyModal) {
      closeHistoryModal();
    }
  });
  
  // Fechar modal com tecla Esc
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && historyModal.classList.contains('show')) {
      closeHistoryModal();
    }
  });
}

// Manipula o envio do formulário
function handleSubmit(e) {
  e.preventDefault();
  
  // Validação dos campos
  if (!validateForm()) return;
  
  const formData = new FormData(form);
  const produto = {
    nome: formData.get('name').trim(),
    unidade: formData.get('unit').trim(),
    estoque: parseFloat(formData.get('stock')),
    descricao: formData.get('desc').trim(),
    dataAtualizacao: new Date().toISOString()
  };
  
  if (editIndex >= 0) {
    // Atualiza produto existente
    const produtoAntigo = { ...produtos[editIndex] };
    produtos[editIndex] = produto;
    registrarMovimentacao('edicao', produto, null, produtoAntigo);
    showToast('Produto atualizado com sucesso!', 'success');
  } else {
    // Adiciona novo produto
    produtos.unshift(produto);
    registrarMovimentacao('entrada', produto, produto.estoque);
    showToast('Produto adicionado com sucesso!', 'success');
  }
  
  // Salva e atualiza a interface
  saveProdutos();
  form.reset();
  editIndex = -1;
  cancelBtn.style.display = 'none';
}

// Valida o formulário
function validateForm() {
  let isValid = true;
  const name = form.elements['name'].value.trim();
  const unit = form.elements['unit'].value.trim();
  const stock = form.elements['stock'].value;
  
  // Valida nome
  if (name.length < 2) {
    showError('name', 'O nome deve ter pelo menos 2 caracteres');
    isValid = false;
  } else {
    hideError('name');
  }
  
  // Valida unidade
  if (unit.length === 0) {
    showError('unit', 'Informe a unidade de medida');
    isValid = false;
  } else {
    hideError('unit');
  }
  
  // Valida estoque
  if (isNaN(stock) || parseFloat(stock) < 0) {
    showError('stock', 'Informe uma quantidade válida');
    isValid = false;
  } else {
    hideError('stock');
  }
  
  return isValid;
}

// Exibe mensagem de erro
function showError(field, message) {
  const errorElement = document.getElementById(`${field}-error`);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    form.elements[field].classList.add('error');
  }
}

// Esconde mensagem de erro
function hideError(field) {
  const errorElement = document.getElementById(`${field}-error`);
  if (errorElement) {
    errorElement.style.display = 'none';
    form.elements[field].classList.remove('error');
  }
}

// Renderiza a lista de produtos
function renderProdutos(searchTerm = '') {
  let filteredProdutos = [...produtos];
  
  // Filtra os produtos se houver um termo de busca
  if (searchTerm) {
    filteredProdutos = produtos.filter(produto => 
      produto.nome.toLowerCase().includes(searchTerm) ||
      (produto.descricao && produto.descricao.toLowerCase().includes(searchTerm))
    );
  }
  
  // Limpa a tabela
  tableBody.innerHTML = '';
  
  // Exibe mensagem de lista vazia se não houver produtos
  if (filteredProdutos.length === 0) {
    emptyState.style.display = 'block';
    return;
  }
  
  // Esconde mensagem de lista vazia
  emptyState.style.display = 'none';
  
  // Adiciona os produtos à tabela
  filteredProdutos.forEach((produto, index) => {
    const tr = document.createElement('tr');
    tr.className = 'fade-in';
    tr.innerHTML = `
      <td data-label="Produto">${produto.nome}</td>
      <td data-label="Estoque">${formatNumber(produto.estoque)}</td>
      <td data-label="Unidade">${produto.unidade}</td>
      <td data-label="Descrição">${produto.descricao || '-'}</td>
      <td class="actions" data-label="Ações">
        <button class="btn btn-edit" data-index="${index}" aria-label="Editar">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-out" data-index="${index}" aria-label="Dar saída" title="Dar baixa no estoque">
          <i class="fas fa-arrow-down"></i>
        </button>
        <button class="btn btn-danger" data-index="${index}" aria-label="Excluir">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    
    // Adiciona os eventos aos botões
    const buttons = tr.querySelectorAll('button');
    buttons[0].addEventListener('click', () => editProduto(index));
    buttons[1].addEventListener('click', () => handleSaida(index));
    buttons[2].addEventListener('click', () => confirmDelete(index));
    
    tableBody.appendChild(tr);
  });
}

// Formata números com separador de milhar
function formatNumber(num) {
  return new Intl.NumberFormat('pt-BR').format(num);
}

// Edita um produto
function editProduto(index) {
  const produto = produtos[index];
  if (!produto) return;
  
  // Preenche o formulário
  form.elements['name'].value = produto.nome;
  form.elements['unit'].value = produto.unidade;
  form.elements['stock'].value = produto.estoque;
  form.elements['desc'].value = produto.descricao || '';
  
  // Atualiza o estado
  editIndex = index;
  cancelBtn.style.display = 'inline-flex';
  
  // Rola até o formulário
  form.scrollIntoView({ behavior: 'smooth' });
  form.elements['name'].focus();
  
  showToast('Preencha os campos e clique em Salvar para atualizar', 'info');
}

// Cancela a edição
function cancelEdit() {
  form.reset();
  editIndex = -1;
  cancelBtn.style.display = 'none';
  showToast('Edição cancelada', 'info');
}

// Manipula a saída de estoque
function handleSaida(index) {
  const produto = produtos[index];
  if (!produto) return;
  
  const quantidade = prompt(`Quantas unidades de ${produto.unidade} deseja dar saída?`, '1');
  const qtd = parseFloat(quantidade);
  
  if (isNaN(qtd) || qtd <= 0) {
    showToast('Quantidade inválida', 'error');
    return;
  }
  
  if (qtd > produto.estoque) {
    showToast('Quantidade indisponível em estoque', 'error');
    return;
  }
  
  produto.estoque -= qtd;
  produto.dataAtualizacao = new Date().toISOString();
  
  // Registra a saída no histórico
  registrarMovimentacao('saida', { ...produto }, qtd);
  
  saveProdutos();
  showToast(`Saída de ${qtd} ${produto.unidade} registrada!`, 'success');
}

// Confirma a exclusão de um produto
function confirmDelete(index) {
  const produto = produtos[index];
  if (!produto) return;
  
  if (confirm(`Tem certeza que deseja excluir o produto "${produto.nome}"?`)) {
    // Registra a exclusão no histórico antes de remover
    registrarMovimentacao('exclusao', { ...produto });
    
    produtos.splice(index, 1);
    saveProdutos();
    showToast('Produto excluído com sucesso', 'success');
  }
}

// Registra uma movimentação no histórico
function registrarMovimentacao(tipo, produto, quantidade = null, dadosAntigos = null) {
  const movimentacao = {
    id: Date.now(),
    tipo,
    produto: { ...produto },
    quantidade,
    dadosAntigos,
    data: new Date().toISOString()
  };
  
  historico.unshift(movimentacao);
  
  // Mantém apenas os últimos 1000 registros para evitar armazenamento excessivo
  if (historico.length > 1000) {
    historico = historico.slice(0, 1000);
  }
  
  saveHistory();
  
  // Atualiza a lista de histórico se o modal estiver aberto
  if (historyModal.classList.contains('show')) {
    renderHistory();
  }
}

// Salva o histórico no localStorage
function saveHistory() {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historico));
  } catch (error) {
    console.error('Erro ao salvar histórico:', error);
  }
}

// Salva os produtos no localStorage
function saveProdutos() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(produtos));
    renderProdutos(searchInput.value.toLowerCase());
  } catch (error) {
    console.error('Erro ao salvar produtos:', error);
    showToast('Erro ao salvar os dados', 'error');
  }
}

// Abre o modal de histórico
function openHistoryModal() {
  historyModal.classList.add('show');
  document.body.style.overflow = 'hidden';
  renderHistory();
}

// Fecha o modal de histórico
function closeHistoryModal() {
  historyModal.classList.remove('show');
  document.body.style.overflow = '';
}

// Renderiza o histórico de movimentações
function renderHistory() {
  const tipo = filterType.value;
  const data = filterDate.value;
  
  let historicoFiltrado = [...historico];
  
  // Filtra por tipo
  if (tipo !== 'all') {
    historicoFiltrado = historicoFiltrado.filter(item => item.tipo === tipo);
  }
  
  // Filtra por data
  if (data) {
    const dataFiltro = new Date(data).setHours(0, 0, 0, 0);
    historicoFiltrado = historicoFiltrado.filter(item => {
      const itemData = new Date(item.data).setHours(0, 0, 0, 0);
      return itemData === dataFiltro;
    });
  }
  
  // Limpa a lista
  historyList.innerHTML = '';
  
  if (historicoFiltrado.length === 0) {
    historyList.innerHTML = `
      <div class="empty-history">
        <i class="fas fa-inbox"></i>
        <p>Nenhuma movimentação encontrada</p>
      </div>
    `;
    return;
  }
  
  // Adiciona os itens ao histórico
  historicoFiltrado.forEach(item => {
    const itemElement = document.createElement('div');
    itemElement.className = 'history-item fade-in';
    
    const tipoTexto = {
      'entrada': 'Entrada',
      'saida': 'Saída',
      'edicao': 'Edição',
      'exclusao': 'Exclusão'
    }[item.tipo];
    
    const dataFormatada = formatarData(item.data);
    let descricao = '';
    
    switch (item.tipo) {
      case 'entrada':
        descricao = `Produto adicionado: ${item.produto.nome} (${item.quantidade} ${item.produto.unidade})`;
        break;
      case 'saida':
        descricao = `Saída de ${item.quantidade} ${item.produto.unidade} de ${item.produto.nome}`;
        break;
      case 'edicao':
        const alteracoes = [];
        if (item.dadosAntigos.nome !== item.produto.nome) {
          alteracoes.push(`nome de "${item.dadosAntigos.nome}" para "${item.produto.nome}"`);
        }
        if (item.dadosAntigos.unidade !== item.produto.unidade) {
          alteracoes.push(`unidade de "${item.dadosAntigos.unidade}" para "${item.produto.unidade}"`);
        }
        if (item.dadosAntigos.estoque !== item.produto.estoque) {
          alteracoes.push(`estoque de ${item.dadosAntigos.estoque} para ${item.produto.estoque}`);
        }
        if (item.dadosAntigos.descricao !== item.produto.descricao) {
          alteracoes.push('descrição');
        }
        descricao = `Produto editado: ${item.produto.nome} (${alteracoes.join(', ')})`;
        break;
      case 'exclusao':
        descricao = `Produto removido: ${item.produto.nome} (${item.produto.estoque} ${item.produto.unidade})`;
        break;
    }
    
    itemElement.innerHTML = `
      <div class="history-info">
        <span class="history-type ${item.tipo}">${tipoTexto}</span>
        <p class="history-desc">${descricao}</p>
      </div>
      <span class="history-time">${dataFormatada}</span>
    `;
    
    historyList.appendChild(itemElement);
  });
}

// Formata a data para exibição
function formatarData(dataString) {
  const data = new Date(dataString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(data);
}


// Exibe uma notificação
function showToast(message, type = 'info') {
  // Limpa o timeout anterior se existir
  if (toast.timeoutId) {
    clearTimeout(toast.timeoutId);
  }
  
  // Atualiza o conteúdo e o estilo do toast
  toast.textContent = message;
  toast.className = `toast ${type}`;
  
  // Mostra o toast
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Esconde o toast após 3 segundos
  toast.timeoutId = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Adiciona suporte para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('ServiceWorker registrado com sucesso:', registration.scope);
    }).catch(error => {
      console.log('Falha ao registrar ServiceWorker:', error);
    });
  });
}

// Adiciona evento para instalação PWA
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  // Previne o prompt automático
  e.preventDefault();
  // Armazena o evento para que possa ser acionado depois
  deferredPrompt = e;
  
  // Opcional: Mostra um botão para instalar o PWA
  // Você pode implementar isso na sua interface
  console.log('Pode instalar o aplicativo');
});

// Função para mostrar o prompt de instalação
function showInstallPrompt() {
  if (deferredPrompt) {
    // Mostra o prompt
    deferredPrompt.prompt();
    
    // Aguarda o usuário responder ao prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('Usuário aceitou a instalação');
      } else {
        console.log('Usuário recusou a instalação');
      }
      deferredPrompt = null;
    });
  }
}