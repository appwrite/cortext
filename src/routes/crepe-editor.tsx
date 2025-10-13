import { createFileRoute } from '@tanstack/react-router';
import CrepeEditor, { CrepeTheme } from '../components/ui/crepe-editor';
import { useState, useCallback } from 'react';

function CrepeEditorPage() {
  console.log('CrepeEditorPage component rendered');
  
  // Initial content - CNN article about SpaceX Starship moon race with enhanced markdown
  const initialContent = `# NASA has a wild plan to return astronauts to the moon. Here's why experts are starting to worry

*By Jackie Wattles*  
*Updated Oct 13, 2025, 7:42 AM ET*

Calls for the United States to return astronauts to the moon before the end of the decade have been increasingly loud and frequent, emanating from bipartisan lawmakers and science advocates alike. But underlying that drumbeat is a quagmire of epic proportions.

NASA plans to use SpaceX's **Starship** — the largest rocket system ever constructed — for a key portion of the lunar journey, yet it's still unclear whether the vehicle will work. And a fierce competitor is nipping at the agency's heels.

> "The China National Space Administration will almost certainly walk on the moon in the next five years," Bill Nye, the entertainer of "Science Guy" fame and CEO of the nonprofit exploration advocacy group [The Planetary Society](https://www.planetary.org), said during a recent demonstration against the Trump Administration's plans to cut science funding. "This is a turning point. This is a key point in this history of space exploration."

## The Starship Challenge

Starship is still in the nascent stages of a long and laborious development process. So far, parts of the vehicle have failed in dramatic fashion during **six of its 10 test flights**. Another prototype recently exploded during ground testing. SpaceX is set to launch its next test, Flight 11, as soon as 7:15 p.m. ET Monday from the company's South Texas launch facilities.

The megarocket has yet to hit several key testing milestones. These include figuring out how to top off Starship's fuel as it sits parked in orbit around Earth. Such a step is necessary given the vehicle's design and enormous size — but it's **never been attempted before** with any spacecraft.

### Fuel Requirements

Adding to the uncertainty is that no one knows exactly how many tankers full of fuel SpaceX will need to launch to give Starship enough gas for a moon-landing mission, which NASA has planned for **mid-2027**.

One SpaceX executive estimated in 2024 that number "will roughly be 10-ish."

But, more recently, engineers at NASA's [Johnson Space Center](https://www.nasa.gov/centers/johnson/home/index.html) in Houston estimated that a single moon landing could require SpaceX to launch **more than 40 tankers** — which are Starship vehicles designed to carry fuel, according to one former NASA official who spoke on condition of anonymity.

That estimate may be specific to the current version of Starship, referred to as Version 2 or V2, that SpaceX is flying, the source noted. And the company is expected to debut an upgraded version of the vehicle after its next test mission on Monday that could change those predictions.

## Expert Concerns

Still, even if the number of refueling flights is somewhere between 10 and 40, in general, the path NASA has chosen to return to the moon is "**extraordinarily complex**," Jim Bridenstine, who was NASA administrator during President Donald Trump's first term, said at a Senate committee hearing in September.

> "This is an architecture that no NASA administrator that I'm aware of would have selected had they had the choice," Bridenstine said, referring to the decision to use Starship as the vehicle that will land astronauts on the moon.

That choice was made in 2021 when the space agency was without a Senate-confirmed leader.

Acting NASA administrator Sean Duffy responded to the Senate hearing during a September 4 town hall with agency employees, saying the hearing amounted to "shade thrown on all of us."

> "Maybe I am competitive. I was angry about it," Duffy said. "I'll be damned if that is the story that we write. We are going to beat the Chinese to the moon."

## The Competition

NASA's plan, however, is "**incredibly hard, complex**" and likely a decade away from reality, according to Doug Loverro, a former NASA associate administrator for human exploration and operations.

From his vantage point, Loverro said NASA's decision to use Starship as the lunar lander for the [Artemis III mission](https://www.nasa.gov/specials/artemis/) was made in error.

SpaceX made big promises on paper, he said, referring to the bid the company submitted to secure the **$2.9 billion contract** for the job. And while Loverro said he believes the company will eventually deliver on its pledges to make Starship operational — he also thinks there is no way it will have the vehicle ready before China lands astronauts on the moon.

### Contract Selection Process

One former NASA official close to the selection process told CNN that Starship beat out its competitors in a series of technical evaluations that a team of NASA experts conducted. The assessments evaluated Starship's capabilities as well as costs to the government — an important consideration because NASA had limited funds to dole out.

"It was not like this was a controversial decision at that stage" from the agency's point of view, the source said, adding that NASA would have liked to have chosen two companies to compete to build lunar landers but simply did not have the money.

SpaceX's competitor, **Blue Origin**, sued the federal government over the decision, alleging the space agency unfairly favored SpaceX. But a judge ultimately upheld NASA's decision.

## Timeline Challenges

Despite a growing chorus of voices expressing concern that pinning the outcome of a moon race on Starship may be a losing bet, not many stakeholders are ready to decry the plan publicly or recommend shifting course.

In fact, Sen. Ted Cruz of Texas, a key figure in US space policy, made it clear during a September hearing that he thinks it is too late to ditch Starship for an alternative plan:

> "Any drastic changes in NASA's architecture at this stage threaten United States leadership in space," Cruz said then.

Behind closed doors, however, some space industry leaders have voiced deep concerns.

When asked about the public discourse, Loverro said that it's possible that the gravity of the issue may not have fully sunk in across space industry leadership.

> "I think we're really at step one of the 12-step process of figuring out we have a problem," he said.

## Safety Advisory Panel Assessment

During a September 21 meeting of NASA's Aerospace Safety Advisory Panel, member Paul Hill, who had visited SpaceX's Starship development facilities in August, said the timeline for this vehicle is "**significantly challenged**."

The ASAP committee expects the vehicle will be "**years late**" to the 2027 deadline, Hill said.

However, Hill also complimented SpaceX, repeating sentiments frequently voiced by space industry leaders and stakeholders: Even if SpaceX is behind schedule, the company has a long track record of excellence and tends to get things done even when conventional wisdom suggests it will fail.

> "There is a multifaceted, self-perpetuating genius, for lack of a better way of saying it, at SpaceX," Hill said, heaping praise on the company's business model and development approach. "There is no competitor, whether government or industry, that has this full combination of factors."

## Starship Test Flight History

| Flight | Date | Status | Key Events |
|--------|------|--------|------------|
| Flight 1 | April 2023 | ~~Failed~~ | Exploded during ascent |
| Flight 2 | November 2023 | ~~Failed~~ | Stage separation issues |
| Flight 3 | March 2024 | ~~Failed~~ | Lost during re-entry |
| Flight 4 | June 2024 | ~~Failed~~ | Landing burn failure |
| Flight 5 | August 2024 | ~~Failed~~ | Engine shutdown |
| Flight 6 | October 2024 | ~~Failed~~ | Structural failure |
| Flight 7 | December 2024 | ~~Failed~~ | Guidance system error |
| Flight 8 | February 2025 | ~~Failed~~ | Fuel system malfunction |
| Flight 9 | May 2025 | ~~Failed~~ | Landing gear deployment |
| Flight 10 | August 2025 | ~~Failed~~ | Communication loss |
| Flight 11 | October 2025 | *Pending* | Scheduled for testing |

## Key Challenges Summary

The following are the *primary concerns* raised by experts:

1. **Technical Complexity**: The Starship architecture is ~~unprecedented~~ *extraordinarily complex*
2. **Timeline Pressure**: China's lunar ambitions create ~~artificial~~ *realistic* urgency
3. **Budget Constraints**: The $2.9 billion contract may be ~~insufficient~~ *challenging* for the scope
4. **Testing Failures**: ~~Six~~ *Ten* consecutive test flight failures raise concerns
5. **Refueling Logistics**: ~~10~~ *40+* tanker launches required per mission

### Additional Resources

- [NASA Artemis Program](https://www.nasa.gov/specials/artemis/)
- [SpaceX Starship Updates](https://www.spacex.com/vehicles/starship/)
- [China's Lunar Program](https://www.cnsa.gov.cn/english/)
- [The Planetary Society](https://www.planetary.org)

---

*Source: [CNN Science](https://edition.cnn.com/2025/10/12/science/spacex-starship-moon-race-nasa-china)*`;

  const [content, setContent] = useState(initialContent);
  const [currentTheme, setCurrentTheme] = useState<CrepeTheme>('crepe');

  // Memoize the onChange callback to prevent unnecessary rerenders
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
  }, []);

  // Theme options
  const themes: { value: CrepeTheme; label: string; description: string }[] = [
    { value: 'crepe', label: 'Crepe', description: 'Default Crepe theme with modern styling' },
    { value: 'crepe-dark', label: 'Crepe Dark', description: 'Dark variant of the Crepe theme' },
    { value: 'nord', label: 'Nord', description: 'Nord color scheme with clean aesthetics' },
    { value: 'nord-dark', label: 'Nord Dark', description: 'Dark variant of the Nord theme' },
    { value: 'frame', label: 'Frame', description: 'Frame theme with structured layout' },
    { value: 'frame-dark', label: 'Frame Dark', description: 'Dark variant of the Frame theme' },
    { value: 'cortext', label: 'Cortext', description: 'Cortext theme integrated with app styles' },
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Crepe Milkdown Editor</h1>
        <p className="text-gray-600 mb-4">
          A beautiful WYSIWYG Markdown editor with multiple themes
        </p>
        
        {/* Theme Selector */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">Choose Theme</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {themes.map((theme) => (
              <button
                key={theme.value}
                onClick={() => setCurrentTheme(theme.value)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  currentTheme === theme.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">{theme.label}</div>
                <div className="text-sm text-gray-600">{theme.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg border">
        <div className="p-6">
          <CrepeEditor 
            defaultValue={initialContent} 
            onChange={handleContentChange}
            theme={currentTheme}
            className="min-h-[500px]"
          />
        </div>
      </div>

      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Current Content (Markdown):</h3>
        <pre className="bg-white p-4 rounded border text-sm overflow-auto max-h-96">
          {content}
        </pre>
      </div>

      <div className="mt-6 text-center text-gray-500">
        <p>
          Powered by{' '}
          <a 
            href="https://milkdown.dev" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Milkdown
          </a>{' '}
          • Built with{' '}
          <a 
            href="https://milkdown.dev/docs/guide/using-crepe" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Crepe
          </a>
        </p>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/crepe-editor')({
  component: CrepeEditorPage,
});
