import React, { useEffect, useState } from 'react';
import { getCollections, createCollection, updateCollection, deleteCollection } from '../services/collections.service';
import BrandTitle from '../components/BrandTitle';
import { Search, Plus, Edit2, Trash2, Eye, X, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { Link } from 'react-router-dom';
import { uploadImage } from '../services/upload.service';

const Collections = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCollection, setCurrentCollection] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    banner_url: '',
    thumbnail_url: '',
    mobile_banner_url: ''
  });
  
  const [uploading, setUploading] = useState({
    banner: false,
    mobile: false,
    thumbnail: false
  });

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const data = await getCollections();
      setCollections(data || []);
    } catch (error) {
      console.error('Erro ao buscar coleções:', error);
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
    setFormData({ name: '', slug: '', description: '', banner_url: '', thumbnail_url: '', mobile_banner_url: '' });
    setCurrentCollection(null);
    setIsModalOpen(true);
  };

  const openEditModal = (collection) => {
    setIsEditMode(true);
    setCurrentCollection(collection);
    setFormData({
      name: collection.name || '',
      slug: collection.slug || '',
      description: collection.description || '',
      banner_url: collection.banner_url || '',
      thumbnail_url: collection.thumbnail_url || '',
      mobile_banner_url: collection.mobile_banner_url || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ name: '', slug: '', description: '', banner_url: '', thumbnail_url: '', mobile_banner_url: '' });
    setCurrentCollection(null);
  };

  const handleFileUpload = async (e, field, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(prev => ({ ...prev, [type]: true }));
      const url = await uploadImage(file, 'collections', formData.slug || 'geral');
      setFormData(prev => ({ ...prev, [field]: url }));
    } catch (error) {
      console.error(`Erro ao fazer upload de ${type}:`, error);
      alert(`Erro ao fazer upload da imagem.`);
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) return;

    try {
      if (isEditMode && currentCollection) {
        await updateCollection(currentCollection.id, formData);
      } else {
        await createCollection(formData);
      }
      closeModal();
      fetchCollections();
    } catch (error) {
      console.error('Erro ao salvar coleção:', error);
      alert('Erro ao salvar coleção. Verifique se o slug já existe.');
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Tem certeza que deseja excluir a coleção "${name}"? Os produtos não serão apagados.`)) {
      try {
        await deleteCollection(id);
        fetchCollections();
      } catch (error) {
        console.error('Erro ao excluir coleção:', error);
      }
    }
  };

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-6xl md:text-[80px] font-display text-text-primary uppercase tracking-[-0.03em] leading-[0.92] mb-4">
            <BrandTitle text="GESTÃO DE COLEÇÕES" />
          </h1>
          <p className="text-text-secondary text-base font-inter max-w-lg">
            Gerencie as coleções da loja, banners e informações.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-3 bg-surface-card border border-surface-border rounded-full px-4 py-2 focus-within:ring-1 focus-within:ring-white/10 transition-all w-64">
            <Search size={16} className="text-text-secondary opacity-50" />
            <input 
              type="text" 
              placeholder="Buscar coleção..." 
              className="bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-secondary/50 w-full transition-all font-inter"
            />
          </div>
          <button 
            onClick={openCreateModal}
            className="px-8 py-3 bg-brand-DEFAULT text-white rounded-full font-oswald text-[14px] uppercase tracking-[0.12em] font-medium hover:brightness-110 transition-all shadow-[0_0_20px_rgba(255,42,31,0.2)] flex items-center gap-2"
          >
            <Plus size={18} />
            NOVA COLEÇÃO
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-12 text-center text-text-secondary font-inter">Carregando coleções...</div>
        ) : collections.length === 0 ? (
          <div className="col-span-full py-12 text-center text-text-secondary font-inter">Nenhuma coleção encontrada.</div>
        ) : (
          collections.map((collection) => (
            <div key={collection.id} className="bg-surface-card rounded-3xl border border-surface-border overflow-hidden flex flex-col group hover:-translate-y-[2px] hover:shadow-[0_0_30px_rgba(255,42,31,0.05)] hover:border-surface-cardHover transition-all duration-300">
              
              <div className="h-48 relative overflow-hidden bg-surface-primary border-b border-surface-border pointer-events-none">
                {collection.banner_url || collection.thumbnail_url || collection.image_url ? (
                  <img 
                    src={collection.banner_url || collection.thumbnail_url || collection.image_url} 
                    alt={collection.name} 
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={48} className="text-text-secondary opacity-20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-surface-primary to-transparent opacity-60"></div>
              </div>
              
              <div className="p-8 flex-1 flex flex-col">
                <div className="flex-1">
                  <h3 className="text-[28px] font-display text-text-primary uppercase tracking-[-0.02em] leading-[1] mb-2 group-hover:text-brand-DEFAULT transition-colors">
                    {collection.name}
                  </h3>
                  <p className="text-[14px] font-inter text-text-secondary line-clamp-2 mb-4">
                    {collection.description || 'Sem descrição'}
                  </p>
                  
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-surface-border text-[12px] font-oswald font-medium tracking-[0.12em] text-text-secondary uppercase">
                    PRODUTOS: <span className="text-white">{collection.products?.[0]?.count || 0}</span>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-surface-border flex items-center justify-between">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEdit(collection)}
                        className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/[0.03] border border-surface-border text-text-secondary hover:text-white hover:bg-white/[0.06] hover:border-white/20 transition-all"
                        title="Editar coleção"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(collection.id)}
                        className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-DEFAULT/10 border border-brand-DEFAULT/20 text-brand-DEFAULT hover:bg-brand-DEFAULT hover:text-white transition-all"
                        title="Excluir coleção"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <Link 
                      to={`/admin/collections/${collection.slug}`}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-surface-border text-[12px] font-oswald font-medium tracking-[0.12em] text-text-primary uppercase hover:bg-white/[0.06] hover:border-white/20 transition-all"
                    >
                      VER PRODUTOS
                      <Eye size={14} />
                    </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Criar/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[100px] bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-card border border-surface-border rounded-3xl w-full max-w-2xl flex flex-col shadow-2xl max-h-[calc(100vh-120px)] overflow-hidden">
            <div className="p-6 border-b border-surface-border flex items-center justify-between bg-surface-primary shrink-0">
              <h2 className="text-[20px] font-display text-text-primary uppercase tracking-[-0.01em]">
                {isEditMode ? 'EDITAR COLEÇÃO' : 'NOVA COLEÇÃO'}
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
                    Nome da Coleção *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleNameChange}
                    className="bg-surface-primary border border-surface-border rounded-xl px-4 py-3 text-sm font-inter text-text-primary focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
                    placeholder="Ex: Ancestralidade Brasileira"
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
                    placeholder="ex: ancestralidade-brasileira"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Banner Desktop */}
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-oswald font-medium tracking-[0.12em] text-text-secondary uppercase">
                    Banner (Desktop)
                  </label>
                  <div className="relative overflow-hidden group">
                    {formData.banner_url ? (
                      <div className="relative h-32 rounded-xl overflow-hidden border border-surface-border bg-black/20">
                        <img src={formData.banner_url} alt="Banner" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button type="button" onClick={() => setFormData({...formData, banner_url: ''})} className="p-2 bg-red-500/80 text-white rounded-lg hover:bg-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-32 rounded-xl border border-dashed border-white/20 hover:border-brand-DEFAULT/50 hover:bg-brand-DEFAULT/5 transition-colors flex flex-col items-center justify-center text-text-secondary relative cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'banner_url', 'banner')}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={uploading.banner}
                        />
                        {uploading.banner ? (
                          <span className="text-sm">Enviando...</span>
                        ) : (
                          <>
                            <UploadCloud size={24} className="mb-2 opacity-50" />
                            <span className="text-xs">Upload do Banner</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Banner Mobile */}
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-oswald font-medium tracking-[0.12em] text-text-secondary uppercase">
                    Banner (Mobile)
                  </label>
                  <div className="relative overflow-hidden group">
                    {formData.mobile_banner_url ? (
                      <div className="relative h-32 rounded-xl overflow-hidden border border-surface-border bg-black/20">
                        <img src={formData.mobile_banner_url} alt="Banner Mobile" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button type="button" onClick={() => setFormData({...formData, mobile_banner_url: ''})} className="p-2 bg-red-500/80 text-white rounded-lg hover:bg-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-32 rounded-xl border border-dashed border-white/20 hover:border-brand-DEFAULT/50 hover:bg-brand-DEFAULT/5 transition-colors flex flex-col items-center justify-center text-text-secondary relative cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'mobile_banner_url', 'mobile')}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={uploading.mobile}
                        />
                        {uploading.mobile ? (
                          <span className="text-sm">Enviando...</span>
                        ) : (
                          <>
                            <UploadCloud size={24} className="mb-2 opacity-50" />
                            <span className="text-xs">Upload do Banner</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Thumbnail */}
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-oswald font-medium tracking-[0.12em] text-text-secondary uppercase">
                    Thumbnail
                  </label>
                  <div className="relative overflow-hidden group">
                    {formData.thumbnail_url ? (
                      <div className="relative h-32 rounded-xl overflow-hidden border border-surface-border bg-black/20">
                        <img src={formData.thumbnail_url} alt="Thumbnail" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button type="button" onClick={() => setFormData({...formData, thumbnail_url: ''})} className="p-2 bg-red-500/80 text-white rounded-lg hover:bg-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-32 rounded-xl border border-dashed border-white/20 hover:border-brand-DEFAULT/50 hover:bg-brand-DEFAULT/5 transition-colors flex flex-col items-center justify-center text-text-secondary relative cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'thumbnail_url', 'thumbnail')}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={uploading.thumbnail}
                        />
                        {uploading.thumbnail ? (
                          <span className="text-sm">Enviando...</span>
                        ) : (
                          <>
                            <UploadCloud size={24} className="mb-2 opacity-50" />
                            <span className="text-xs">Upload da Thumbnail</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
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
                  placeholder="Descrição da coleção..."
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
                  SALVAR COLEÇÃO
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Collections;
