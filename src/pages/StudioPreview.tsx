import React from 'react';
import { useSearchParams } from 'react-router-dom';
import sessionData from '../../.social/studio-session.json';

// Interfaces for type safety
interface SlideData {
    id: string;
    headline: string;
    copy: string;
    visual: string;
    cta: string;
}

interface IdentityData {
    colors: {
        primary: string;
        secondary: string;
        text: string;
        background: string;
        accent: string;
    };
    fonts: {
        primary: string;
        secondary: string;
    };
}

const StudioPreview = () => {
    const [searchParams] = useSearchParams();
    const showOnly = searchParams.get('showOnly');

    // Safe access to data with fallbacks
    const chosenProposal = sessionData?.chosen_proposal;
    const identity = sessionData?.metadata?.identity?.data as IdentityData;

    if (!chosenProposal || !identity) {
        return <div className="text-white p-10">Erro: Sessão ou Identidade não encontrada em .social/studio-session.json</div>;
    }

    // Extract slides helper
    const extractSlidesFromProposal = (proposal: any): SlideData[] => {
        const slides = [];
        if (proposal.slides) {
            proposal.slides.forEach((s: any, i: number) => {
                slides.push({
                    id: `slide-${i + 1}`,
                    headline: s.headline,
                    copy: s.copy,
                    visual: s.visual,
                    cta: s.cta
                });
            });
        }
        if (proposal.story) {
            slides.push({
                id: 'story',
                headline: proposal.story.headline,
                copy: proposal.story.copy,
                visual: proposal.story.visual,
                cta: proposal.story.cta
            });
        }
        return slides;
    };

    const slides = extractSlidesFromProposal(chosenProposal);

    // Render specific slide (High Res mode for Capture)
    if (showOnly) {
        const slide = slides.find(s => s.id === showOnly);
        if (!slide) return <div className="text-white">Slide not found</div>;
        return (
            <div style={{ transform: 'scale(1)', transformOrigin: 'top center', width: 'fit-content', height: 'fit-content' }}>
                <RenderSlide slide={slide} identity={identity} />
            </div>
        );
    }

    // Preview Mode (Grid)
    return (
        <div className="min-h-screen bg-gray-900 p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 place-items-center">
            {slides.map(slide => (
                <div key={slide.id} className="relative group">
                    <div className="absolute -top-6 left-0 text-white font-mono text-sm opacity-50">{slide.id}</div>
                    <div style={{ transform: 'scale(0.3)', transformOrigin: 'top left', width: slide.id === 'story' ? 1080 : 1080, height: slide.id === 'story' ? 1920 : 1350 }}>
                        <RenderSlide slide={slide} identity={identity} />
                    </div>
                    {/* Mock size for the grid container since we scaled down the content */}
                    <div style={{ width: 1080 * 0.3, height: (slide.id === 'story' ? 1920 : 1350) * 0.3 }}></div>
                </div>
            ))}
        </div>
    );
};

const RenderSlide = ({ slide, identity }: { slide: SlideData, identity: IdentityData }) => {
    const width = slide.id === 'story' ? 1080 : 1080;
    const height = slide.id === 'story' ? 1920 : 1350;

    return (
        <div
            id={slide.id}
            className="flex flex-col items-center justify-between p-16 relative overflow-hidden"
            style={{
                width: `${width}px`,
                height: `${height}px`,
                background: `linear-gradient(135deg, ${identity.colors.background} 0%, ${identity.colors.background} 100%)`, // Using mostly background for clean look
                fontFamily: identity.fonts.primary,
                color: identity.colors.text
            }}
        >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-3xl opacity-20 -mr-20 -mt-20" style={{ background: identity.colors.primary }}></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-20 -ml-20 -mb-20" style={{ background: identity.colors.secondary }}></div>

            {/* Header / Brand */}
            <div className="z-10 w-full flex justify-between items-center opacity-80 mb-10">
                <span className="text-2xl font-bold tracking-wider uppercase" style={{ color: identity.colors.primary }}>REUNE</span>
            </div>

            {/* Content Container */}
            <div className="z-10 flex-1 flex flex-col items-center justify-center w-full max-w-4xl text-center space-y-10">

                {/* Visual Placeholder or Icon */}
                <div className="w-full aspect-video bg-gray-100/50 rounded-3xl flex items-center justify-center border-2 border-dashed border-gray-300 p-8">
                    <p className="text-3xl text-gray-400 italic font-light">{slide.visual}</p>
                </div>

                {/* Headline */}
                <h1 className="text-6xl font-black leading-tight tracking-tight" style={{ color: identity.colors.text }}>
                    {slide.headline}
                </h1>

                {/* Copy */}
                <p className="text-3xl font-medium leading-relaxed opacity-90 max-w-3xl">
                    {slide.copy}
                </p>
            </div>

            {/* Footer / CTA */}
            <div className="z-10 mt-12 w-full flex flex-col items-center">
                {slide.cta && (
                    <div className="px-12 py-6 rounded-full text-3xl font-bold shadow-lg transition-transform"
                        style={{ backgroundColor: identity.colors.primary, color: '#fff' }}>
                        {slide.cta}
                    </div>
                )}
            </div>
        </div>
    );
}

export default StudioPreview;
