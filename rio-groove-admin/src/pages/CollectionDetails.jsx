import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCollectionBySlug } from '../services/collections.service';
import BrandTitle from '../components/BrandTitle';
import { ArrowLeft, Package, Image as ImageIcon } from 'lucide-react';

const CollectionDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollection();
  }, [slug]);

  const fetchCollection = async () => {
    try {
      setLoading(true);
      const data = await getCollectionBySlug(slug);
      setCollection(data);
    } catch (error) {
      console.error('Erro ao buscar coleção:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-text-secondary font-inter">Carregando coleção...</div>;
  }

  if (!collection) {
    return <div className="p-10 text-center text-text-secondary font-inter">Coleção não encontrada.</div>;
  }

  const products = collection.products || [];

  return (
    <div className="animate-in fade-in duration-700">
      <Link to="/admin/collections" className="inline-flex items-center gap-2 text-[12px] font-oswald font-medium tracking-[0.12em] text-text-secondary hover:text-white transition-colors mb-8 uppercase">
        <ArrowLeft size={16} />
        VOLTAR PARA COLEÇÕES
      </Link>

      <div className="relative rounded-3xl overflow-hidden mb-12 border border-surface-border h-[300px]">
        {collection.banner_url || collection.thumbnail_url || collection.image_url ? (
          <img 
            src={collection.banner_url || collection.thumbnail_url || collection.image_url} 
            alt={collection.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-surface-primary flex items-center justify-center">
            <ImageIcon size={64} className="text-text-secondary opacity-20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-primary via-surface-primary/80 to-transparent pointer-events-none"></div>
        
        <div className="absolute inset-x-0 bottom-0 p-10 flex flex-col md:flex-row md:items-end justify-between gap-6 z-10">
          <div>
            <h1 className="text-6xl md:text-[80px] font-display text-text-primary uppercase tracking-[-0.03em] leading-[0.92] mb-4">
              <BrandTitle text={collection.name} />
            </h1>
            <p className="text-text-secondary text-base font-inter max-w-2xl line-clamp-2">
              {collection.description || 'Sem descrição.'}
            </p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/admin/products', { state: { openCreateModal: true, collectionId: collection.id } })}
              className="px-8 py-3 bg-brand-DEFAULT text-white rounded-full font-oswald text-[14px] uppercase tracking-[0.12em] font-medium hover:brightness-110 transition-all shadow-[0_0_20px_rgba(255,42,31,0.2)]"
            >
              ADICIONAR PRODUTO
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-[14px] font-oswald font-medium tracking-[0.12em] text-text-primary uppercase">
          PRODUTOS DA COLEÇÃO ({products.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.length === 0 ? (
          <div className="col-span-full py-12 text-center text-text-secondary font-inter bg-surface-card border border-surface-border rounded-3xl">
            Nenhum produto nesta coleção.
          </div>
        ) : (
          products.map(product => (
            <div 
              key={product.id} 
              onClick={() => navigate('/admin/products', { state: { editProduct: product } })}
              className="bg-surface-card rounded-3xl border border-surface-border p-5 flex flex-col group hover:-translate-y-[2px] hover:border-surface-cardHover hover:shadow-[0_0_30px_rgba(255,42,31,0.05)] transition-all duration-300 relative cursor-pointer z-10"
            >
              <div className="aspect-[3/4] relative rounded-2xl overflow-hidden bg-surface-primary border border-surface-border mb-5 pointer-events-none">
                {product.product_images?.length > 0 ? (
                  <img src={product.product_images[0].image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={32} className="text-text-secondary opacity-30" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 flex flex-col pointer-events-none">
                <h3 className="text-[20px] font-display uppercase tracking-[-0.01em] text-text-primary mb-1 group-hover:text-brand-DEFAULT transition-colors">
                  {product.name}
                </h3>
                <p className="text-[14px] font-inter font-medium text-text-primary mb-4">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price || 0)}
                </p>
                
                <div className="mt-auto pt-4 border-t border-white/[0.05] flex justify-between items-center pointer-events-auto">
                  <span className={`text-[12px] font-oswald font-medium tracking-[0.12em] uppercase ${product.active !== false ? 'text-[#00FF9D]' : 'text-text-secondary'}`}>
                    {product.active !== false ? 'ATIVO' : 'INATIVO'}
                  </span>
                  
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Prevent default behavior to avoid routing when clicking "Remover"
                    }}
                    className="text-[12px] font-oswald font-medium tracking-[0.1em] text-brand-DEFAULT hover:text-white uppercase transition-colors"
                  >
                    REMOVER
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default CollectionDetails;
