import React, { useState, useEffect } from 'react'
import { JSONProcessingIndicator } from './json-processing-indicator'
import { Button } from '@/components/ui/button'

/**
 * Test component to demonstrate JSON processing indicator
 * Shows different stages of JSON processing with animations
 */
export function JSONProcessingTest() {
  const [testContent, setTestContent] = useState('')
  const [currentTest, setCurrentTest] = useState(0)

  const testScenarios = [
    {
      name: 'Empty Content',
      content: '',
      description: 'No JSON content'
    },
    {
      name: 'Detecting Stage',
      content: 'J',
      description: 'Just starting to detect JSON'
    },
    {
      name: 'Parsing Stage',
      content: '{"article": {"title": "My Article"',
      description: 'JSON being parsed, no closing brace yet'
    },
    {
      name: 'Validating Stage',
      content: '{"article": {"title": "My Article", "subtitle": "A great subtitle"}}',
      description: 'Complete JSON but no newline yet'
    },
    {
      name: 'Completed Stage',
      content: '{"article": {"title": "My Article", "subtitle": "A great subtitle"}}\n\nThis is the explanation text that appears after the JSON is processed.',
      description: 'Complete JSON with explanation'
    },
    {
      name: 'Error Stage',
      content: '{"article": {"title": "My Article", "subtitle": "A great subtitle"}\n\nInvalid JSON structure',
      description: 'Malformed JSON that will cause an error'
    },
    {
      name: 'Large JSON',
      content: '{"sections": [{"id": "1", "type": "text", "content": "This is a very long section with lots of content that would normally take a while to process and could make users wait without feedback. The JSON processing indicator helps provide visual feedback during this process."}, {"id": "2", "type": "code", "content": "function example() { return "code block"; }"}, {"id": "3", "type": "title", "content": "Another Section"}]',
      description: 'Large JSON that would benefit from processing feedback'
    }
  ]

  const runTest = (index: number) => {
    setCurrentTest(index)
    setTestContent('')
    
    const scenario = testScenarios[index]
    const content = scenario.content
    
    if (content === '') {
      return
    }

    // Simulate streaming by adding characters progressively
    let currentIndex = 0
    const interval = setInterval(() => {
      if (currentIndex < content.length) {
        setTestContent(content.slice(0, currentIndex + 1))
        currentIndex++
      } else {
        clearInterval(interval)
      }
    }, 50) // Add character every 50ms
  }

  const runAllTests = () => {
    let testIndex = 0
    const runNextTest = () => {
      if (testIndex < testScenarios.length) {
        runTest(testIndex)
        testIndex++
        setTimeout(runNextTest, 3000) // Wait 3 seconds between tests
      }
    }
    runNextTest()
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">JSON Processing Indicator Test</h2>
        <p className="text-muted-foreground">
          This demonstrates the JSON processing feedback component with different scenarios
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {testScenarios.map((scenario, index) => (
            <Button
              key={index}
              variant={currentTest === index ? "default" : "outline"}
              size="sm"
              onClick={() => runTest(index)}
            >
              {scenario.name}
            </Button>
          ))}
        </div>

        <Button onClick={runAllTests} className="w-full">
          Run All Tests Sequentially
        </Button>
      </div>

      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">
            Current Test: {testScenarios[currentTest]?.name}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {testScenarios[currentTest]?.description}
          </p>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Content Preview:</label>
              <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs font-mono">
                {testContent || '(empty)'}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Processing Indicator:</label>
              <div className="mt-2">
                <JSONProcessingIndicator content={testContent} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground space-y-2">
        <h4 className="font-semibold">Features Demonstrated:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Real-time progress tracking based on JSON structure</li>
          <li>Smooth animations and visual feedback</li>
          <li>Different stages: detecting, parsing, validating, completed, error</li>
          <li>Detailed progress information and character counts</li>
          <li>Color-coded states with appropriate icons</li>
          <li>Glow effects and bouncing dots during processing</li>
          <li>Success sparkle animation when complete</li>
        </ul>
      </div>
    </div>
  )
}
