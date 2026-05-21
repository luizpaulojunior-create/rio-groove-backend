import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/products.service';
import { getCollections } from '../services/collections.service';
import { uploadImage } from '../services/upload.service';
import BrandTitle from '../components/BrandTitle';
import { Search, Plus, Edit2, Trash2, X, Image as ImageIcon, Package, UploadCloud } from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    price: '',
    promotional_price: '',
    category: '',
    stock: '',
    image_url: '',
    images: [],
    collection_id: '',
    active: true,
    fabric_appearances: [],
    tags: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (location.state?.editProduct) {
      openEditModal(location.state.editProduct);
      navigate(location.pathname, { replace: true, state: {} });
    } else if (location.state?.openCreateModal) {
      openCreateModal(location.state.collectionId);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

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

  const openCreateModal = (initialCollectionId = '') => {
    setIsEditMode(false);
    setFormData({
      name: '',
      slug: '',
      description: '',
      short_description: '',
      price: '',
      promotional_price: '',
      category: '',
      stock: '',
      image_url: '',
      images: [],
      collection_id: typeof initialCollectionId === 'string' ? initialCollectionId : '',
      active: true,
      fabric_appearances: [],
      tags: []
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
      short_description: product.short_description || '',
      price: product.price || '',
      promotional_price: product.promotional_price || '',
      category: product.category || '',
      stock: product.stock !== undefined ? product.stock : '',
      image_url: product.image_url || '',
      images: product.product_images || product.images || [],
      collection_id: product.collection_id || '',
      active: product.active !== false,
      fabric_appearances: product.fabric_appearances || product.fabricAppearances || [],
      tags: product.tags ? (Array.isArray(product.tags) ? product.tags : product.tags.split(',').map(t=>t.trim())) : []
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentProduct(null);
  };

  const addImageField = () => {
    setFormData({
      ...formData,
      images: [...formData.images, { image_url: '', color_variant: '', alt_text: '', sort_order: formData.images.length }]
    });
  };

  const updateImageField = (index, field, value) => {
    const newImages = [...formData.images];
    newImages[index][field] = value;
    setFormData({ ...formData, images: newImages });
  };

  const removeImageField = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    // Re-index sort_order
    newImages.forEach((img, i) => img.sort_order = i);
    setFormData({ ...formData, images: newImages });
  };

  const moveImage = (index, direction) => {
    if ((direction === -1 && index === 0) || (direction === 1 && index === formData.images.length - 1)) return;
    const newImages = [...formData.images];
    const temp = newImages[index];
    newImages[index] = newImages[index + direction];
    newImages[index + direction] = temp;
    
    // Re-index sort_order
    newImages.forEach((img, i) => img.sort_order = i);
    setFormData({ ...formData, images: newImages });
  };

  const handleMultipleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    try {
      setUploadingImage(true);
      const newImages = [];
      for (const file of files) {
        const url = await uploadImage(file, 'products', formData.slug || 'geral');
        newImages.push({
          image_url: url,
          color_variant: '',
          alt_text: formData.name || '',
          sort_order: formData.images.length + newImages.length
        });
      }
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImages]
      }));
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload das imagens.');
    } finally {
      setUploadingImage(false);
      // reset file input
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.slug || !formData.price) return;

    try {
      const dataToSave = {
        ...formData,
        price: parseFloat(formData.price),
        promotional_price: formData.promotional_price ? parseFloat(formData.promotional_price) : null,
        stock: parseInt(formData.stock || 0, 10),
        collection_id: formData.collection_id || null,
        image_url: formData.images && formData.images.length > 0 ? formData.images[0].image_url : formData.image_url
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
      if (error.response && error.response.data && error.response.data.error) {
        const msg = error.response.data.error.message || error.response.data.error;
        if (msg.includes('duplicate key') || msg.includes('unique constraint')) {
          alert('Erro: O slug informado já está em uso por outro produto.');
        } else {
          alert(`Erro ao salvar produto: ${msg}`);
        }
      } else {
        alert('Erro ao salvar produto. Tente novamente.');
      }
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
                      <Link to={`/admin/products/${product.id}`} className="flex items-center gap-4 cursor-pointer">
                        <div className="w-12 h-12 rounded-lg bg-surface-primary border border-surface-border overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {product.images?.length > 0 ? (
                            <img src={product.images[0].image_url} alt={product.name} className="w-full h-full object-cover" />
                          ) : product.product_images?.length > 0 ? (
                            <img src={product.product_images[0].image_url} alt={product.name} className="w-full h-full object-cover" />
                          ) : product.image_url ? (
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
                          {(product.fabric_appearances?.length > 0 || product.fabricAppearances?.length > 0) && (
                            <div className="flex gap-1 mt-1.5 flex-wrap">
                              {(product.fabric_appearances || product.fabricAppearances).map(fa => (
                                <span key={fa} className="text-[9px] px-1.5 py-0.5 bg-white/[0.05] border border-white/10 text-text-secondary rounded uppercase">{fa}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </Link>
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
                        product.stock > 10 ? 'bg-white/[0.03] text-text-primary border border-surface-border' :
                        product.stock > 0 ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                        'bg-brand-DEFAULT/10 text-brand-DEFAULT border border-brand-DEFAULT/20'
                      }`}>
                        {product.stock || 0}
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
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[100px] pb-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-card border border-surface-border rounded-3xl w-full max-w-3xl flex flex-col shadow-2xl max-h-[calc(100vh-140px)] overflow-hidden">
            <div className="p-6 border-b border-surface-border flex items-center justify-between bg-surface-primary shrink-0">
              <h2 className="text-[20px] font-display text-text-primary uppercase tracking-[-0.01em]">
                {isEditMode ? 'EDITAR PRODUTO' : 'NOVO PRODUTO'}
              </h2>
              <button type="button" onClick={closeModal} className="text-text-secondary hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6">
              
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

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                    Preço Promo
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.promotional_price}
                    onChange={(e) => setFormData({...formData, promotional_price: e.target.value})}
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
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
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
                    Categoria
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="bg-surface-primary border border-surface-border rounded-xl px-4 py-3 text-sm font-inter text-text-primary focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
                    placeholder="Ex: camisetas"
                  />
                </div>
                
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
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-oswald font-medium tracking-[0.12em] text-text-secondary uppercase">
                  Acabamentos (Checks)
                </label>
                <div className="flex flex-wrap gap-4 bg-surface-primary border border-surface-border rounded-xl px-4 py-3">
                  {['liso', 'estonado', 'offWhite'].map(check => (
                    <label key={check} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.fabric_appearances.includes(check)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({...formData, fabric_appearances: [...formData.fabric_appearances, check]});
                          } else {
                            setFormData({...formData, fabric_appearances: formData.fabric_appearances.filter(c => c !== check)});
                          }
                        }}
                        className="w-4 h-4 rounded border-surface-border bg-black/20 text-brand-DEFAULT focus:ring-brand-DEFAULT focus:ring-offset-surface-primary accent-brand-DEFAULT"
                      />
                      <span className="text-sm font-inter text-text-primary capitalize">{check}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-oswald font-medium tracking-[0.12em] text-text-secondary uppercase">
                  Tags (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={formData.tags.join(', ')}
                  onChange={(e) => setFormData({...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)})}
                  className="bg-surface-primary border border-surface-border rounded-xl px-4 py-3 text-sm font-inter text-text-primary focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
                  placeholder="ex: novidade, verao, promo"
                />
              </div>

              <div className="flex flex-col gap-4 border border-surface-border rounded-2xl p-4 bg-white/[0.01]">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-oswald font-medium tracking-[0.12em] text-text-secondary uppercase">
                    Galeria de Imagens
                  </label>
                  <div className="relative overflow-hidden inline-block">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleMultipleFiles}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploadingImage}
                    />
                    <button
                      type="button"
                      className="flex items-center gap-1 text-[11px] font-oswald uppercase tracking-wider text-brand-DEFAULT hover:text-white transition-colors bg-brand-DEFAULT/10 hover:bg-brand-DEFAULT px-3 py-1.5 rounded-full pointer-events-none"
                    >
                      <Plus size={12} />
                      {uploadingImage ? 'ENVIANDO...' : 'ADICIONAR IMAGENS'}
                    </button>
                  </div>
                </div>
                
                {formData.images.length === 0 && (
                  <div className="relative text-center py-10 text-sm text-text-secondary font-inter bg-black/20 rounded-xl border border-dashed border-white/20 hover:border-brand-DEFAULT/50 hover:bg-brand-DEFAULT/5 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleMultipleFiles}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploadingImage}
                    />
                    <UploadCloud size={32} className="mx-auto mb-3 opacity-50" />
                    <p>{uploadingImage ? 'Enviando imagens...' : 'Clique ou arraste imagens aqui'}</p>
                    <p className="text-xs opacity-50 mt-1">A primeira imagem será a principal</p>
                  </div>
                )}
                
                <div className="flex flex-col gap-3">
                  {formData.images.map((img, index) => (
                    <div key={index} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-surface-primary p-3 rounded-xl border border-surface-border">
                      <div className="flex flex-col gap-1 w-full md:w-auto flex-1">
                        <input
                          type="url"
                          value={img.image_url}
                          onChange={(e) => updateImageField(index, 'image_url', e.target.value)}
                          className="bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs font-inter text-text-primary focus:outline-none focus:border-white/20 w-full"
                          placeholder="URL da imagem *"
                          required
                        />
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        <input
                          type="text"
                          value={img.color_variant}
                          onChange={(e) => updateImageField(index, 'color_variant', e.target.value)}
                          className="bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs font-inter text-text-primary focus:outline-none focus:border-white/20 flex-1 md:w-24"
                          placeholder="Cor/Variante"
                        />
                        <input
                          type="text"
                          value={img.alt_text}
                          onChange={(e) => updateImageField(index, 'alt_text', e.target.value)}
                          className="bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs font-inter text-text-primary focus:outline-none focus:border-white/20 flex-1 md:w-32"
                          placeholder="Texto Alt"
                        />
                      </div>
                      
                      {img.image_url && (
                        <div className="w-10 h-10 rounded bg-black/40 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                          <img src={img.image_url} alt="preview" className="max-w-full max-h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                        </div>
                      )}

                      <div className="flex items-center gap-1 justify-end w-full md:w-auto pt-2 md:pt-0 border-t md:border-none border-white/5 mt-2 md:mt-0">
                        <button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0} className={`p-1.5 rounded bg-black/20 text-white/50 ${index === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10 hover:text-white'}`}>
                          ↑
                        </button>
                        <button type="button" onClick={() => moveImage(index, 1)} disabled={index === formData.images.length - 1} className={`p-1.5 rounded bg-black/20 text-white/50 ${index === formData.images.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10 hover:text-white'}`}>
                          ↓
                        </button>
                        <button type="button" onClick={() => removeImageField(index)} className="p-1.5 rounded bg-brand-DEFAULT/10 text-brand-DEFAULT hover:bg-brand-DEFAULT hover:text-white ml-2">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-oswald font-medium tracking-[0.12em] text-text-secondary uppercase">
                  Descrição Curta
                </label>
                <textarea
                  value={formData.short_description}
                  onChange={(e) => setFormData({...formData, short_description: e.target.value})}
                  rows={2}
                  className="bg-surface-primary border border-surface-border rounded-xl px-4 py-3 text-sm font-inter text-text-primary focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all resize-none"
                  placeholder="Descrição curta para listagens..."
                ></textarea>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-oswald font-medium tracking-[0.12em] text-text-secondary uppercase">
                  Descrição Completa
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                  className="bg-surface-primary border border-surface-border rounded-xl px-4 py-3 text-sm font-inter text-text-primary focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all resize-none"
                  placeholder="Descrição completa do produto..."
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end gap-4 p-6 border-t border-surface-border shrink-0 bg-surface-primary">
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
