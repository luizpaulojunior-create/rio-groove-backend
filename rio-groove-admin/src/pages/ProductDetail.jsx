import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct } from '../services/products.service';
import BrandTitle from '../components/BrandTitle';
import { ArrowLeft, Edit2, Package, Tag, CheckSquare, AlignLeft, Layers } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await getProduct(id);
        if (data?.product) {
          setProduct(data.product);
        } else if (data && !data.error) {
          setProduct(data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Erro ao buscar produto:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="animate-in fade-in duration-700">
        <div className="py-12 text-center text-text-secondary font-inter">Carregando produto...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="animate-in fade-in duration-700">
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-2xl font-display text-text-primary uppercase mb-4">Produto não encontrado</h2>
          <button
            onClick={() => navigate('/admin/products')}
            className="px-6 py-2 bg-surface-card border border-surface-border text-white rounded-full font-oswald text-[14px] uppercase tracking-[0.12em] hover:bg-white/[0.04] transition-all flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Voltar para Listagem
          </button>
        </div>
      </div>
    );
  }

  const handleEdit = () => {
    navigate('/admin/products', { state: { editProduct: product } });
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined || price === '') return '';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  const images = product.images?.length > 0 ? product.images : product.product_images?.length > 0 ? product.product_images : [];
  const mainImage = images.length > 0 ? images[0].image_url : product.image_url;
  const fabricAppearances = product.fabric_appearances || product.fabricAppearances || [];
  const tags = product.tags ? (Array.isArray(product.tags) ? product.tags : product.tags.split(',').map(t=>t.trim())) : [];

  return (
    <div className="animate-in fade-in duration-700 pb-12">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/products')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-card border border-surface-border text-text-secondary hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl md:text-5xl font-display text-text-primary uppercase tracking-[-0.03em] leading-[0.92]">
            <BrandTitle text="DETALHES DO PRODUTO" />
          </h1>
        </div>
        
        <button
          onClick={handleEdit}
          className="px-6 py-2.5 bg-brand-DEFAULT text-white rounded-full font-oswald text-[14px] uppercase tracking-[0.12em] font-medium hover:brightness-110 transition-all flex items-center gap-2 shrink-0 shadow-[0_0_20px_rgba(255,42,31,0.2)]"
        >
          <Edit2 size={16} />
          <span className="hidden md:inline">Editar Produto</span>
        </button>
      </div>

      <div className="bg-surface-card rounded-3xl border border-surface-border p-6 md:p-8 flex flex-col gap-8">
        {/* Header / Main Info */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-full md:w-1/3 aspect-square rounded-2xl bg-surface-primary border border-surface-border overflow-hidden flex items-center justify-center">
            {mainImage ? (
              <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <Package size={64} className="text-text-secondary opacity-20" />
            )}
          </div>
          
          <div className="flex-1 flex flex-col gap-6 w-full">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-display text-text-primary uppercase tracking-[-0.01em]">{product.name}</h2>
                  <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-oswald font-medium uppercase tracking-[0.1em] ${
                    product.active !== false
                      ? 'bg-[#00FF9D]/10 text-[#00FF9D] border border-[#00FF9D]/20' 
                      : 'bg-white/[0.03] text-text-secondary border border-surface-border'
                  }`}>
                    {product.active !== false ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <p className="text-sm font-inter text-text-secondary">Slug: {product.slug}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface-primary p-4 rounded-xl border border-surface-border">
                <p className="text-[11px] font-oswald font-medium tracking-[0.1em] text-text-secondary uppercase mb-1">Preço</p>
                <p className="text-lg font-display text-text-primary">{formatPrice(product.price)}</p>
              </div>
              {product.promotional_price && (
                <div className="bg-surface-primary p-4 rounded-xl border border-brand-DEFAULT/30">
                  <p className="text-[11px] font-oswald font-medium tracking-[0.1em] text-brand-DEFAULT uppercase mb-1">Promocional</p>
                  <p className="text-lg font-display text-brand-DEFAULT">{formatPrice(product.promotional_price)}</p>
                </div>
              )}
              <div className="bg-surface-primary p-4 rounded-xl border border-surface-border">
                <p className="text-[11px] font-oswald font-medium tracking-[0.1em] text-text-secondary uppercase mb-1">Estoque</p>
                <p className="text-lg font-display text-text-primary">{product.stock || 0} un</p>
              </div>
              {product.category && (
                <div className="bg-surface-primary p-4 rounded-xl border border-surface-border">
                  <p className="text-[11px] font-oswald font-medium tracking-[0.1em] text-text-secondary uppercase mb-1">Categoria</p>
                  <p className="text-lg font-display text-text-primary capitalize">{product.category}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="h-px bg-surface-border w-full"></div>

        {/* Additional Info Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Descriptions */}
          <div className="flex flex-col gap-6">
            {(product.short_description || product.description) && (
              <div>
                <h3 className="text-sm font-oswald font-medium tracking-[0.1em] text-text-primary uppercase flex items-center gap-2 mb-4">
                  <AlignLeft size={16} className="text-text-secondary" />
                  Descrições
                </h3>
                <div className="flex flex-col gap-4">
                  {product.short_description && (
                    <div className="bg-surface-primary p-4 rounded-xl border border-surface-border">
                      <p className="text-[11px] font-oswald font-medium tracking-[0.1em] text-text-secondary uppercase mb-2">Curta</p>
                      <p className="text-sm font-inter text-text-primary whitespace-pre-wrap">{product.short_description}</p>
                    </div>
                  )}
                  {product.description && (
                    <div className="bg-surface-primary p-4 rounded-xl border border-surface-border">
                      <p className="text-[11px] font-oswald font-medium tracking-[0.1em] text-text-secondary uppercase mb-2">Completa</p>
                      <p className="text-sm font-inter text-text-primary whitespace-pre-wrap">{product.description}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Fabric Appearances */}
            {fabricAppearances.length > 0 && (
              <div>
                <h3 className="text-sm font-oswald font-medium tracking-[0.1em] text-text-primary uppercase flex items-center gap-2 mb-4">
                  <CheckSquare size={16} className="text-text-secondary" />
                  Acabamentos (Checks)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {fabricAppearances.map((app, i) => (
                    <span key={i} className="px-3 py-1.5 bg-surface-primary border border-surface-border rounded-lg text-sm font-inter text-text-primary capitalize">
                      {app}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div>
                <h3 className="text-sm font-oswald font-medium tracking-[0.1em] text-text-primary uppercase flex items-center gap-2 mb-4">
                  <Tag size={16} className="text-text-secondary" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1.5 bg-surface-primary border border-surface-border rounded-lg text-xs font-inter text-text-secondary">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Gallery & Variations */}
          <div className="flex flex-col gap-6">
            {images.length > 0 && (
              <div>
                <h3 className="text-sm font-oswald font-medium tracking-[0.1em] text-text-primary uppercase flex items-center gap-2 mb-4">
                  <Layers size={16} className="text-text-secondary" />
                  Galeria de Imagens
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {images.map((img, i) => (
                    <div key={i} className="aspect-square rounded-xl bg-surface-primary border border-surface-border overflow-hidden relative group">
                      <img src={img.image_url} alt={img.alt_text || `Imagem ${i+1}`} className="w-full h-full object-cover" />
                      {img.color_variant && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm p-1.5 text-[10px] text-center font-inter text-white truncate">
                          {img.color_variant}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
