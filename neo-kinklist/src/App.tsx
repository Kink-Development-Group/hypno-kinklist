import React from 'react';
import { KinklistProvider, useKinklist } from './context/KinklistContext';
import Legend from './components/Legend';
import Export from './components/Export';
import InputList from './components/InputList';
import EditOverlay from './components/EditOverlay';
import InputOverlay from './components/InputOverlay';
import './styles/main.scss';

// Default kinks text
const defaultKinksText = `#Bodies
(General)
* Skinny
* Chubby
* Small breasts
* Large breasts
* Small cocks
* Large cocks

#Clothing
(Self, Partner)
* Clothed sex
* Lingerie
* Stockings
* Heels
* Leather
* Latex
* Uniform / costume
* Cross-dressing

#Groupings
(General)
* You and 1 male
* You and 1 female
* You and MtF trans
* You and FtM trans
* You and 1 male, 1 female
* You and 2 males
* You and 2 females
* Orgy

#General
(Giving, Receiving)
* Romance / Affection
* Handjob / fingering
* Blowjob
* Deep throat
* Swallowing
* Facials
* Cunnilingus
* Face-sitting
* Edging
* Teasing
* JOI, SI

#Ass play
(Giving, Receiving)
* Anal toys
* Anal sex, pegging
* Rimming
* Double penetration
* Anal fisting

#Restrictive
(Self, Partner)
* Gag
* Collar
* Leash
* Chastity
* Bondage (Light)
* Bondage (Heavy)
* Encasement

#Toys
(Self, Partner)
* Dildos
* Plugs
* Vibrators
* Sounding

#Domination
(Dominant, Submissive)
* Dominant / Submissive
* Domestic servitude
* Slavery
* Pet play
* DD/lg, MD/lb
* Discipline
* Begging
* Forced orgasm
* Orgasm control
* Orgasm denial
* Power exchange

#No consent
(Aggressor, Target)
* Non-con / rape
* Blackmail / coercion
* Kidnapping
* Drugs / alcohol
* Sleep play

#Taboo
(General)
* Incest
* Ageplay
* Interracial / Raceplay
* Bestiality
* Necrophilia
* Cheating
* Exhibitionism
* Voyeurism

#Surrealism
(Self, Partner)
* Futanari
* Furry
* Vore
* Transformation
* Tentacles
* Monster or Alien

#Fluids
(General)
* Blood
* Watersports
* Scat
* Lactation
* Diapers
* Cum play

#Degradation
(Giving, Receiving)
* Glory hole
* Name calling
* Humiliation

#Touch & Stimulation
(Actor, Subject)
* Cock/Pussy worship
* Ass worship
* Foot play
* Tickling
* Sensation play
* Electro stimulation

#Misc. Fetish
(Giving, Receiving)
* Fisting
* Gangbang
* Breath play
* Impregnation
* Pregnancy
* Feminization
* Cuckold / Cuckquean

#Pain
(Giving, Receiving)
* Light pain
* Heavy pain
* Nipple clamps
* Clothes pins
* Caning
* Flogging
* Beating
* Spanking
* Cock/Pussy slapping
* Cock/Pussy torture
* Hot Wax
* Scratching
* Biting
* Cutting`;

const App: React.FC = () => {
  // Imgur client ID for image uploads
  const imgurClientId = '9db53e5936cd02f';

  return (
    <KinklistProvider initialKinksText={defaultKinksText}>
      <AppContent imgurClientId={imgurClientId} />
    </KinklistProvider>
  );
};

// Separate component to use context
const AppContent: React.FC<{ imgurClientId: string }> = ({ imgurClientId }) => {
  const { setIsEditOverlayOpen, setIsInputOverlayOpen } = useKinklist();

  const handleEditClick = () => {
    setIsEditOverlayOpen(true);
  };

  const handleStartClick = () => {
    setIsInputOverlayOpen(true);
  };

  return (
    <div className="widthWrapper">
      <button type='button' title='edit' id="Edit" onClick={handleEditClick}></button>
      <h1>Kink list</h1>
      
      <Legend />
      
      <Export imgurClientId={imgurClientId} />
      
      <button type='button' title='start' id="StartBtn" onClick={handleStartClick}></button>
      
      <InputList />
      
      <EditOverlay />
      
      <InputOverlay />
    </div>
  );
};

export default App;
