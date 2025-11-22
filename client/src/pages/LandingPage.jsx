import React, { useState, useEffect } from 'react' 
import Header from '../components/Header'
import Footer from '../components/Footer'

const isAndroidMobile = () => {
    if (typeof window === 'undefined') return false; 

    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    const isAndroid = /android/i.test(userAgent);
    const isMobile = /Mobi|Android|iPhone|iPad|Windows Phone/i.test(userAgent);
    
    return isAndroid && isMobile; 
};


function LandingPage() {

    const apkFilePath = 'https://drive.google.com/uc?export=download&id=1uBQd4oAu11yA_ggC0Q1uPM3iNpT3sZNO';

    const backgroundImagePath = '/landing-page-img.png';
    
    const [showDownloadButton, setShowDownloadButton] = useState(false);

    useEffect(() => {
        setShowDownloadButton(isAndroidMobile());
    }, []);


    return (
        <>
            <div className='page-body'>
                <Header className="header"></Header>
                
                <div className='landing-hero'>
                    <div className='hero-overlay'>
                        <div className='hero-content'>
                            <h1 className='hero-quote'>When losing something <br /> doesn’t mean it’s gone forever </h1>
                            
                            {showDownloadButton && (
                                <a
                                  href={apkFilePath}
                                  download="SpotSyncApp.apk" 
                                  className="download-button"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-download" viewBox="0 0 16 16">
                                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
                                    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"/>
                                  </svg>
                                  Download APK (Android)
                                </a>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className='page-features'>
                    <h1 className='features-title'>Core Features</h1>
                    <div className='features-grid'>
                        
                        <div className='feature-card'>
                            <h3 className='feature-header'>Advanced AI Identifies Likely Item Matches</h3>
                            <section className='content'>
                                <i className='bi bi-robot feature-icon' />
                                <p>Our intelligent system uses machine learning to analyze item images and descriptions, automatically detecting high-probability matches between lost and found posts, so users are quickly notified when a strong match (80% or higher) is identified.</p>
                            </section>
                        </div>

                        <div className='feature-card'>
                            <h3 className='feature-header'>Easily Search or Post Lost/Found Items</h3>
                            <section className='content'>
                                <i className='bi bi-binoculars feature-icon' />
                                <p>Whether you've lost something or found someone else’s item, our platform makes it simple to post or search with just a few details and images for better accuracy.</p>
                            </section>
                        </div>

                        <div className='feature-card'>
                            <h3 className='feature-header'>Notified Instantly When There’s a Match</h3>
                            <section className='content'>
                                <i className='bi bi-bell feature-icon' />
                                <p>Users receive email or in-app notifications the moment a possible match is detected for their lost or found item. No need to constantly check the status manually.</p>
                            </section>
                        </div>
                        
                        
                    </div>
                </div>
            </div>
            <Footer />
            
            <style>{`
            .page-body {
                font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                background-color: #f8f9fa;
            }
            
            .landing-hero {
                position: relative;
                min-height: 85vh;
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                background-image: url(${backgroundImagePath});
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
            }
            
            .hero-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6));
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .hero-content {
                z-index: 10;
                flex: none;
                max-width: 1200px;
                width: 90%;
                padding: 80px 20px;
                text-align: center;
            }
            
            .hero-quote {
                font-size: 3.5rem;
                font-weight: 800;
                color: #ffffff;
                line-height: 1.2;
                margin-bottom: 30px;
            }

            .download-button {
                display: inline-flex;
                align-items: center;
                gap: 10px;
                padding: 15px 30px;
                background-color: #007bff;
                color: white;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 1.1rem;
                transition: background-color 0.3s, transform 0.2s;
                box-shadow: 0 4px 10px rgba(0, 123, 255, 0.3);
                margin-top: 20px;
            }
            .download-button:hover {
                background-color: #0056b3;
                transform: translateY(-2px);
            }

            .page-features {
                max-width: 1200px;
                margin: 80px auto;
                padding: 0 20px;
                text-align: center;
            }
            .features-title {
                font-size: 2.5rem;
                font-weight: 700;
                color: #143447;
                margin-bottom: 50px;
            }
            .features-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 30px;
            }
            .feature-card {
                background-color: white;
                padding: 30px;
                border-radius: 12px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
                text-align: left;
                transition: box-shadow 0.3s;
            }
            .feature-card:hover {
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
            }
            .feature-header {
                font-size: 1.4rem;
                color: #007bff;
                margin-top: 0;
                margin-bottom: 15px;
                font-weight: 600;
            }
            .feature-card .content {
                display: flex;
                align-items: flex-start;
                gap: 15px;
            }
            .feature-card p {
                font-size: 1rem;
                color: #555;
                line-height: 1.6;
                margin: 0;
            }
            .feature-icon {
                font-size: 30px;
                color: #143447;
                min-width: 30px;
            }

            @media (max-width: 768px) {
                .landing-hero {
                    min-height: 60vh;
                }
                .hero-content {
                    padding: 40px 20px;
                }
                .hero-quote {
                    font-size: 2.5rem;
                }
            }
          `}</style>
        </>
    )
}

export default LandingPage