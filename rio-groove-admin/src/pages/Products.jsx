import React, { useEffect, useState } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/products.service';
import { getCollections } from '../services/collections.service';
import BrandTitle from '../components/BrandTitle';
import { Search, Plus, Edit2, Trash2, X, Image as ImageIcon, Package } from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    stock_quantity: '',
    image_url: '',
    collection_id: '',
    active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsData, collectionsData] = await Promise.all([
        getProducts().catch(() => []),
        getCollections().catch(() => [])
      ]);
      setProducts(Array.isArray(productsData) ? productsData : (productsData?.products || []));
      setCollections(Array.isArray(collectionsData) ? collectionsData : (collectionsData?.collections || []));
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name) => {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setFormData({
      ...formData,
      name: newName,
      slug: isEditMode ? formData.slug : generateSlug(newName)
    });
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setFormData({
      name: '',
      slug: '',
      description: '',
      price: '',
      stock_quantity: '',
      image_url: '',
      collection_id: '',
      active: true
    });
    setCurrentProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setIsEditMode(true);
    setCurrentProduct(product);
    setFormData({
      name: product.name || '',
      slug: product.slug || '',
      description: product.description || '',
      price: product.price || '',
      stock_quantity: product.stock_quantity || '',
      image_url: product.image_url || '',
      collection_id: product.collection_id || '',
      active: product.active !== false
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentProduct(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.slug || !formData.price) return;

    try {
      const dataToSave = {
        ...formData,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity || 0, 10),
        collection_id: formData.collection_id || null
      };

      if (isEditMode && currentProduct) {
        await updateProduct(currentProduct.id, dataToSave);
      } else {
        await createProduct(dataToSave);
      }
      closeModal();
      fetchData();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert('Erro ao salvar produto. Verifique se o slug já existe.');
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Tem certeza que deseja excluir o produto "${name}"?`)) {
      try {
        await deleteProduct(id);
        fetchData();
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
      }
    }
  };

  const filteredProducts = products.filter(product => 
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-6xl md:text-[80px] font-display text-text-primary uppercase tracking-[-0.03em] leading-[0.92] mb-4">
            <BrandTitle text="GESTÃO DE PRODUTOS" />
          </h1>
          <p className="text-text-secondary text-base font-inter max-w-lg">
            Gerencie o catálogo de produtos, preços, estoque e imagens.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-3 bg-surface-card border border-surface-border rounded-full px-4 py-2 focus-within:ring-1 focus-within:ring-white/10 transition-all w-64">
            <Search size={16} className="text-text-secondary opacity-50" />
            <input 
              type="text" 
              placeholder="Buscar produto..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-secondary/50 w-full transition-all font-inter"
            />
          </div>
          <button 
            onClick={openCreateModal}
            className="px-8 py-3 bg-brand-DEFAULT text-white rounded-full font-oswald text-[14px] uppercase tracking-[0.12em] font-medium hover:brightness-110 transition-all shadow-[0_0_20px_rgba(255,42,31,0.2)] flex items-center gap-2"
          >
            <Plus size={18} />
            NOVO PRODUTO
          </button>
        </div>
      </div>

      <div className="bg-surface-card rounded-3xl border border-surface-border flex flex-col overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="py-5 px-8 text-[12px] font-oswald font-medium tracking-[0.12em] text-text-secondary uppercase">Produto</th>
                <th className="py-5 px-8 text-[12px] font-oswald font-medium tracking-[0.12em] text-text-secondary uppercase">Coleção</th>
                <th className="py-5 px-8 text-[12px] font-oswald font-medium tracking-[0.12em] text-text-secondary uppercase text-right">Preço</th>
                <th className="py-5 px-8 text-[12px] font-oswald font-medium tracking-[0.12em] text-text-secondary uppercase text-center">Estoque</th>
                <th className="py-5 px-8 text-[12px] font-oswald font-medium tracking-[0.12em] text-text-secondary uppercase text-center">Status</th>
                <th className="py-5 px-8 text-[12px] font-oswald font-medium tracking-[0.12em] text-text-secondary uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-text-secondary font-inter">Carregando produtos...</td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-text-secondary font-inter">Nenhum produto encontrado.</td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-5 px-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-surface-primary border border-surface-border overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package size={20} className="text-text-secondary opacity-30" />
                          )}
                        </div>
                        <div>
                          <p className="text-[16px] font-display text-text-primary tracking-[-0.01em] uppercase group-hover:text-brand-DEFAULT transition-colors">
                            {product.name}
                          </p>
                          <p className="text-[12px] font-inter text-text-secondary mt-0.5">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-8">
                      <span className="text-[13px] font-inter text-text-secondary">
                        {product.collection_id 
                          ? collections.find(c => c.id === product.collection_id)?.name || 'Coleção não encontrada'
                          : 'Sem coleção'
                        }
                      </span>
                    </td>
                    <td className="py-5 px-8 text-right">
                      <span className="text-[15px] font-inter font-medium text-text-primary">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price || 0)}
                      </span>
                    </td>
                    <td className="py-5 px-8 text-center">
                      <span className={`inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-md text-[13px] font-inter font-medium ${
                        product.stock_quantity > 10 ? 'bg-white/[0.03] text-text-primary border border-surface-border' :
                        product.stock_quantity > 0 ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                        'bg-brand-DEFAULT/10 text-brand-DEFAULT border border-brand-DEFAULT/20'
                      }`}>
                        {product.stock_quantity || 0}
                      </span>
                    </td>
                    <td className="py-5 px-8 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-oswald font-medium uppercase tracking-[0.1em] ${
                        product.active !== false
                          ? 'bg-[#00FF9D]/10 text-[#00FF9D] border border-[#00FF9D]/20' 
                          : 'bg-white/[0.03] text-text-secondary border border-surface-border'
                      }`}>
                        {product.active !== false ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="py-5 px-8 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(product)}
                          className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-primary border border-surface-border text-text-secondary hover:text-white hover:border-white/20 transition-all"
                          title="Editar"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id, product.name)}
                          className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-DEFAULT/10 border border-brand-DEFAULT/20 text-brand-DEFAULT hover:bg-brand-DEFAULT hover:text-white transition-all"
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Criar/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-card border border-surface-border rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-surface-border flex items-center justify-between bg-surface-primary shrink-0">
              <h2 className="text-[20px] font-display text-text-primary uppercase tracking-[-0.01em]">
                {isEditMode ? 'EDITAR PRODUTO' : 'NOVO PRODUTO'}
              </h2>
              <button type="button" onClick={closeModal} className="text-text-secondary hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-oswald font-medium tracking-[0.12em] text-text-secondary uppercase">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleNameChange}
                    className="bg-surface-primary border border-surface-border rounded-xl px-4 py-3 text-sm font-inter text-text-primary focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
                    placeholder="Ex: Camiseta Street"
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-oswald font-medium tracking-[0.12em] text-text-secondary uppercase">
                    Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: e.target.value})}
                    className="bg-surface-primary border border-surface-border rounded-xl px-4 py-3 text-sm font-inter text-text-primary focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
                    placeholder="ex: camiseta-street"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-oswald font-medium tracking-[0.12em] text-text-secondary uppercase">
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="bg-surface-primary border border-surface-border rounded-xl px-4 py-3 text-sm font-inter text-text-primary focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
                    placeholder="0.00"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-oswald font-medium tracking-[0.12em] text-text-secondary uppercase">
                    Estoque
                  </label>
                  <input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                    className="bg-surface-primary border border-surface-border rounded-xl px-4 py-3 text-sm font-inter text-text-primary focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
                    placeholder="0"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-oswald font-medium tracking-[0.12em] text-text-secondary uppercase">
                    Status
                  </label>
                  <select
                    value={formData.active ? 'true' : 'false'}
                    onChange={(e) => setFormData({...formData, active: e.target.value === 'true'})}
                    className="bg-surface-primary border border-surface-border rounded-xl px-4 py-3 text-sm font-inter text-text-primary focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all appearance-none"
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-oswald font-medium tracking-[0.12em] text-text-secondary uppercase">
                    Coleção
                  </label>
                  <select
                    value={formData.collection_id || ''}
                    onChange={(e) => setFormData({...formData, collection_id: e.target.value})}
                    className="bg-surface-primary border border-surface-border rounded-xl px-4 py-3 text-sm font-inter text-text-primary focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all appearance-none"
                  >
                    <option value="">Selecione uma coleção...</option>
                    {collections.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-oswald font-medium tracking-[0.12em] text-text-secondary uppercase">
                    URL da Imagem Principal
                  </label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                    className="bg-surface-primary border border-surface-border rounded-xl px-4 py-3 text-sm font-inter text-text-primary focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-oswald font-medium tracking-[0.12em] text-text-secondary uppercase">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                  className="bg-surface-primary border border-surface-border rounded-xl px-4 py-3 text-sm font-inter text-text-primary focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all resize-none"
                  placeholder="Descrição do produto..."
                ></textarea>
              </div>

              <div className="flex justify-end gap-4 mt-4 pt-6 border-t border-surface-border">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 bg-transparent border border-surface-border text-text-primary rounded-full font-oswald text-[14px] uppercase tracking-[0.12em] font-medium hover:bg-white/[0.04] transition-all"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-brand-DEFAULT text-white rounded-full font-oswald text-[14px] uppercase tracking-[0.12em] font-medium hover:brightness-110 transition-all shadow-[0_0_20px_rgba(255,42,31,0.2)]"
                >
                  SALVAR PRODUTO
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
